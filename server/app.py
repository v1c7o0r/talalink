import os
import secrets
from datetime import datetime, timedelta, timezone

from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)
from flask_mail import Mail, Message as MailMessage
from werkzeug.utils import secure_filename
from sqlalchemy import or_, and_


app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///talalink.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
app.config['UPLOAD_FOLDER'] = 'static/uploads'

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', 'your-email@gmail.com')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', 'your-app-password')

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)
mail = Mail(app)

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'wahinyavictor818@gmail.com')
OWNER_ORDER_COMMISSION_RATE = float(os.getenv('OWNER_ORDER_COMMISSION_RATE', 0.05))  # 5% default
OWNER_MAINTENANCE_COMMISSION_RATE = float(os.getenv('OWNER_MAINTENANCE_COMMISSION_RATE', 0.02))  # 2% default


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)
    is_verified = db.Column(db.Boolean, default=True)
    verification_token = db.Column(db.String(100), unique=True, nullable=True)

    listings = db.relationship('Listing', backref='author', lazy=True)


class Listing(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100), default='Thika Town')
    image_url = db.Column(db.String(500))
    status = db.Column(db.String(30), default='active', nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Maintenance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default='Pending', nullable=False)
    location = db.Column(db.String(120), nullable=True)

    client_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    artisan_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    phone = db.Column(db.String(30), nullable=True)
    listing_id = db.Column(db.Integer, db.ForeignKey('listing.id'), nullable=True)

    item_price = db.Column(db.Float, default=0.0, nullable=False)
    maintenance_fee = db.Column(db.Float, default=0.0, nullable=False)
    total_price = db.Column(db.Float, default=0.0, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client_user = db.relationship('User', foreign_keys=[client_id], backref='maintenance_requests')
    artisan_user = db.relationship('User', foreign_keys=[artisan_id], backref='assigned_maintenance')
    listing = db.relationship('Listing', foreign_keys=[listing_id], backref='maintenance_tasks')


class CartItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    listing_id = db.Column(db.Integer, db.ForeignKey('listing.id'), nullable=False)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_price = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='cart_items')
    listing = db.relationship('Listing', backref='cart_entries')


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    item = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(30), default='Pending', nullable=False)
    location = db.Column(db.String(120), nullable=True)

    buyer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    seller_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    listing_id = db.Column(db.Integer, db.ForeignKey('listing.id'), nullable=False)

    phone = db.Column(db.String(30), nullable=True)
    quantity = db.Column(db.Integer, default=1, nullable=False)
    unit_price = db.Column(db.Float, default=0.0, nullable=False)
    total_price = db.Column(db.Float, default=0.0, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    buyer_user = db.relationship('User', foreign_keys=[buyer_id], backref='orders_made')
    seller_user = db.relationship('User', foreign_keys=[seller_id], backref='orders_received')
    listing = db.relationship('Listing', foreign_keys=[listing_id], backref='orders')


class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    buyer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    artisan_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=True)
    maintenance_id = db.Column(db.Integer, db.ForeignKey('maintenance.id'), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    buyer_user = db.relationship('User', foreign_keys=[buyer_id], backref='buyer_chats')
    artisan_user = db.relationship('User', foreign_keys=[artisan_id], backref='artisan_chats')
    order = db.relationship('Order', foreign_keys=[order_id], backref='chat_threads')
    maintenance = db.relationship('Maintenance', foreign_keys=[maintenance_id], backref='chat_threads')

    messages = db.relationship(
        'ChatMessage',
        backref='chat',
        lazy=True,
        cascade='all, delete-orphan',
        order_by='ChatMessage.created_at.asc()'
    )


class ChatMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chat_id = db.Column(db.Integer, db.ForeignKey('chat.id'), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')


def clean_phone_digits(phone_value):
    if phone_value is None:
        return ''
    value = str(phone_value).strip()
    return ''.join(ch for ch in value if ch.isdigit())


def normalize_phone(phone_value):
    digits = clean_phone_digits(phone_value)

    if not digits:
        return ''

    if digits.startswith('0') and len(digits) == 10:
        digits = f'254{digits[1:]}'

    if digits.startswith('254') and len(digits) == 12:
        return digits

    return digits if 10 <= len(digits) <= 15 else ''


def is_valid_phone(phone_value):
    normalized_phone = normalize_phone(phone_value)
    return bool(normalized_phone)


def is_admin_user(user):
    return bool(user and user.email.lower() == ADMIN_EMAIL.lower())


def current_user():
    user_id = int(get_jwt_identity())
    return User.query.get_or_404(user_id)


def admin_required_user():
    user = current_user()
    return user if is_admin_user(user) else None


def calculate_maintenance_fee(item_price):
    item_price = float(item_price or 0)
    fee = round(item_price * 0.05, 2)
    total = round(item_price + fee, 2)
    return item_price, fee, total


def serialize_user(user):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "phone_number": user.phone_number or "",
        "is_verified": bool(user.is_verified),
        "is_admin": is_admin_user(user),
        "role": "admin" if is_admin_user(user) else "user"
    }


def serialize_listing(item):
    return {
        "id": item.id,
        "title": item.title,
        "description": item.description,
        "price": item.price,
        "category": item.category,
        "location": item.location,
        "image_url": item.image_url,
        "status": (item.status or 'active').lower(),
        "user_id": item.user_id,
        "phone_number": normalize_phone(item.author.phone_number) if item.author else "",
        "author_username": item.author.username if item.author else None,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


def serialize_maintenance(task, current_user_id=None):
    return {
        "id": task.id,
        "item": task.item,
        "description": task.description or "",
        "status": task.status,
        "location": task.location or "",
        "client": task.client_user.username if task.client_user else None,
        "client_id": task.client_id,
        "artisan": task.artisan_user.username if task.artisan_user else None,
        "artisan_id": task.artisan_id,
        "phone": task.phone or "",
        "listing_id": task.listing_id,
        "item_price": task.item_price,
        "maintenance_fee": task.maintenance_fee,
        "total_price": task.total_price,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None
    }


def serialize_cart_item(cart_item):
    return {
        "id": cart_item.id,
        "user_id": cart_item.user_id,
        "listing_id": cart_item.listing_id,
        "quantity": cart_item.quantity,
        "unit_price": cart_item.unit_price,
        "total_price": cart_item.total_price,
        "listing_title": cart_item.listing.title if cart_item.listing else None,
        "listing_image_url": cart_item.listing.image_url if cart_item.listing else None,
        "seller_id": cart_item.listing.user_id if cart_item.listing else None,
        "seller_username": cart_item.listing.author.username if cart_item.listing and cart_item.listing.author else None,
        "created_at": cart_item.created_at.isoformat() if cart_item.created_at else None
    }


def serialize_order(order):
    return {
        "id": order.id,
        "item": order.item,
        "description": order.description or "",
        "status": order.status,
        "location": order.location or "",
        "buyer": order.buyer_user.username if order.buyer_user else None,
        "buyer_id": order.buyer_id,
        "seller": order.seller_user.username if order.seller_user else None,
        "seller_id": order.seller_id,
        "phone": order.phone or "",
        "listing_id": order.listing_id,
        "quantity": order.quantity,
        "unit_price": order.unit_price,
        "total_price": order.total_price,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None
    }


def serialize_chat_message(message):
    return {
        "id": message.id,
        "chat_id": message.chat_id,
        "sender_id": message.sender_id,
        "sender_username": message.sender.username if message.sender else None,
        "text": message.text,
        "created_at": message.created_at.isoformat() if message.created_at else None
    }


def serialize_chat(chat, viewer_id=None):
    last_message = serialize_chat_message(chat.messages[-1]) if chat.messages else None

    other_user = None
    if viewer_id is not None:
        if chat.buyer_id == viewer_id:
            other_user = chat.artisan_user
        elif chat.artisan_id == viewer_id:
            other_user = chat.buyer_user

    if other_user is None:
        other_user = chat.artisan_user or chat.buyer_user

    return {
        "id": chat.id,
        "buyer_id": chat.buyer_id,
        "artisan_id": chat.artisan_id,
        "order_id": chat.order_id,
        "maintenance_id": chat.maintenance_id,
        "participant_name": other_user.username if other_user else "Unknown User",
        "participant_avatar": (other_user.username[0].upper() if other_user and other_user.username else "U"),
        "created_at": chat.created_at.isoformat() if chat.created_at else None,
        "updated_at": chat.updated_at.isoformat() if chat.updated_at else None,
        "last_message": last_message
    }


def calculate_owner_order_commission(order_total):
    total = float(order_total or 0)
    return round(total * OWNER_ORDER_COMMISSION_RATE, 2)


def calculate_owner_maintenance_commission(maintenance_fee):
    fee = float(maintenance_fee or 0)
    return round(fee * OWNER_MAINTENANCE_COMMISSION_RATE, 2)


def month_label(date_value):
    if not date_value:
        return "Unknown"
    try:
        return date_value.strftime("%b")
    except Exception:
        return "Unknown"


def build_monthly_admin_analytics(listings, maintenance_tasks, orders):
    bucket = {}

    def ensure_month(label):
        if label not in bucket:
            bucket[label] = {
                "month": label,
                "listings": 0,
                "maintenance": 0,
                "orders": 0,
                "order_revenue": 0.0,
                "owner_commission": 0.0,
            }

    for item in listings:
        label = month_label(item.created_at)
        ensure_month(label)
        bucket[label]["listings"] += 1

    for task in maintenance_tasks:
        label = month_label(task.created_at)
        ensure_month(label)
        bucket[label]["maintenance"] += 1
        bucket[label]["owner_commission"] += calculate_owner_maintenance_commission(task.maintenance_fee)

    for order in orders:
        label = month_label(order.created_at)
        ensure_month(label)
        bucket[label]["orders"] += 1
        bucket[label]["order_revenue"] += float(order.total_price or 0)
        bucket[label]["owner_commission"] += calculate_owner_order_commission(order.total_price)

    month_order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Unknown"]

    results = list(bucket.values())
    results.sort(key=lambda item: month_order.index(item["month"]) if item["month"] in month_order else 99)

    for row in results:
        row["order_revenue"] = round(row["order_revenue"], 2)
        row["owner_commission"] = round(row["owner_commission"], 2)

    return results


@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "message": "Welcome to the TalaLink API",
        "endpoints": [
            "/signup",
            "/login",
            "/profile",
            "/listings",
            "/maintenance",
            "/cart",
            "/orders",
            "/chats",
            "/users",
            "/admin/stats",
            "/admin/listings"
        ]
    })


@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}

    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    phone_number = (data.get('phone_number') or '').strip()

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

    if phone_number:
        normalized_phone = normalize_phone(phone_number)
        if not normalized_phone:
            return jsonify({
                "error": "Phone number is invalid. Use a valid format like 0712345678 or 254712345678."
            }), 400
    else:
        normalized_phone = ''

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
    verification_token = secrets.token_urlsafe(32)

    new_user = User(
        username=username,
        email=email,
        password=hashed_pw,
        phone_number=normalized_phone,
        verification_token=verification_token,
        is_verified=True
    )

    db.session.add(new_user)
    db.session.commit()

    try:
        msg = MailMessage(
            'Verify your TalaLink Account',
            sender='noreply@talalink.com',
            recipients=[email]
        )
        msg.body = f"Verify your account here: http://localhost:3000/verify/{verification_token}"
        # mail.send(msg)
    except Exception as e:
        print(f"Mail delivery failed: {e}")

    access_token = create_access_token(identity=str(new_user.id))

    return jsonify({
        "message": "Signup successful",
        "token": access_token,
        "user": serialize_user(new_user)
    }), 201


@app.route('/verify/<token>', methods=['GET'])
def verify_email(token):
    user = User.query.filter_by(verification_token=token).first()

    if not user:
        return jsonify({"error": "Invalid or expired token"}), 400

    user.is_verified = True
    user.verification_token = None
    db.session.commit()

    return jsonify({"message": "Email verified successfully!"}), 200


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}

    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.password, password):
        if not user.is_verified:
            return jsonify({"error": "Please verify your email first"}), 401

        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            "token": access_token,
            "user": serialize_user(user)
        }), 200

    return jsonify({"error": "Invalid email or password"}), 401


@app.route('/profile', methods=['GET', 'PUT'])
@jwt_required()
def handle_profile():
    user = current_user()

    if request.method == 'GET':
        return jsonify(serialize_user(user)), 200

    data = request.get_json() or {}

    new_username = (data.get('username') or user.username).strip()
    new_email = (data.get('email') or user.email).strip().lower()
    new_phone = (data.get('phone_number') or user.phone_number or '').strip()

    if not new_username or not new_email:
        return jsonify({"error": "Username and email are required"}), 400

    if existing_username := User.query.filter(
        User.username == new_username, User.id != user.id
    ).first():
        return jsonify({"error": "Username already exists"}), 400

    if existing_email := User.query.filter(
        User.email == new_email, User.id != user.id
    ).first():
        return jsonify({"error": "Email already exists"}), 400

    normalized_phone = ''
    if new_phone:
        normalized_phone = normalize_phone(new_phone)
        if not normalized_phone:
            return jsonify({
                "error": "Invalid phone number. Use a valid format like 0712345678 or 254712345678."
            }), 400

    if user.email.lower() == ADMIN_EMAIL.lower() and new_email.lower() != ADMIN_EMAIL.lower():
        return jsonify({
            "error": f"Primary admin email must remain {ADMIN_EMAIL}."
        }), 400

    user.username = new_username
    user.email = new_email
    user.phone_number = normalized_phone

    db.session.commit()

    return jsonify({
        "message": "Profile updated successfully",
        "user": serialize_user(user)
    }), 200


@app.route('/admin/stats', methods=['GET'])
@jwt_required()
def admin_stats():
    user = admin_required_user()
    if not user:
        return jsonify({"error": "Admin access required"}), 403

    users = User.query.all()
    listings = Listing.query.all()
    maintenance = Maintenance.query.all()
    cart_items = CartItem.query.all()
    orders = Order.query.all()
    chats = Chat.query.all()
    messages = ChatMessage.query.all()

    return jsonify({
        "total_users": len(users),
        "verified_users": sum(bool(u.is_verified) for u in users),
        "admin_count": sum(bool(is_admin_user(u)) for u in users),
        "total_listings": len(listings),
        "active_listings": sum((item.status or 'active').lower() == 'active' for item in listings),
        "pending_listings": sum((item.status or '').lower() == 'pending' for item in listings),
        "total_maintenance": len(maintenance),
        "pending_maintenance": sum((item.status or '').strip().lower() in ['pending', 'open'] for item in maintenance),
        "completed_maintenance": sum((item.status or '').strip().lower() in ['completed', 'resolved'] for item in maintenance),
        "total_cart_items": len(cart_items),
        "total_orders": len(orders),
        "pending_orders": sum((item.status or '').strip().lower() == 'pending' for item in orders),
        "completed_orders": sum((item.status or '').strip().lower() == 'completed' for item in orders),
        "total_chats": len(chats),
        "total_messages": len(messages),
        "server_time": datetime.now(timezone.utc).isoformat(),
    }), 200


@app.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    user = admin_required_user()
    if not user:
        return jsonify({"error": "Admin access required"}), 403

    users = User.query.order_by(User.id.desc()).all()
    return jsonify([serialize_user(u) for u in users]), 200


@app.route('/users', methods=['POST'])
@jwt_required()
def create_user_admin():
    admin = admin_required_user()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json() or {}

    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    phone_number = (data.get('phone_number') or '').strip()
    is_verified = bool(data.get('is_verified', True))
    role = (data.get('role') or 'user').strip().lower()

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400

    normalized_phone = normalize_phone(phone_number) if phone_number else ''
    if phone_number and not normalized_phone:
        return jsonify({"error": "Invalid phone number"}), 400

    final_email = ADMIN_EMAIL if role == 'admin' else email
    if role == 'admin' and email.lower() != ADMIN_EMAIL.lower():
        return jsonify({
            "error": f"Only {ADMIN_EMAIL} can be treated as admin in the current backend logic."
        }), 400

    new_user = User(
        username=username,
        email=final_email,
        password=bcrypt.generate_password_hash(password).decode('utf-8'),
        phone_number=normalized_phone,
        is_verified=is_verified,
        verification_token=None
    )

    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "message": "User created successfully",
        "user": serialize_user(new_user)
    }), 201


@app.route('/users/<int:user_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_user_admin(user_id):
    admin = admin_required_user()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    user = User.query.get_or_404(user_id)
    data = request.get_json() or {}

    username = (data.get('username') or user.username).strip()
    email = (data.get('email') or user.email).strip().lower()
    phone_number = (data.get('phone_number') or user.phone_number or '').strip()
    role = (data.get('role') or ('admin' if is_admin_user(user) else 'user')).strip().lower()
    password = data.get('password')
    is_verified = data.get('is_verified', user.is_verified)

    if existing_email_user := User.query.filter(
        User.email == email, User.id != user.id
    ).first():
        return jsonify({"error": "Email already exists"}), 400

    if existing_username_user := User.query.filter(
        User.username == username, User.id != user.id
    ).first():
        return jsonify({"error": "Username already exists"}), 400

    normalized_phone = normalize_phone(phone_number) if phone_number else ''
    if phone_number and not normalized_phone:
        return jsonify({"error": "Invalid phone number"}), 400

    if role == 'admin' and email.lower() != ADMIN_EMAIL.lower():
        return jsonify({
            "error": f"Only {ADMIN_EMAIL} can be treated as admin in the current backend logic."
        }), 400

    if user.email.lower() == ADMIN_EMAIL.lower() and role != 'admin':
        return jsonify({"error": "Primary admin email cannot be downgraded in current logic."}), 400

    user.username = username
    user.email = email
    user.phone_number = normalized_phone
    user.is_verified = bool(is_verified)

    if password:
        user.password = bcrypt.generate_password_hash(password).decode('utf-8')

    db.session.commit()

    return jsonify({
        "message": "User updated successfully",
        "user": serialize_user(user)
    }), 200


@app.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user_admin(user_id):
    admin = admin_required_user()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    user = User.query.get_or_404(user_id)

    if user.email.lower() == ADMIN_EMAIL.lower():
        return jsonify({"error": "Primary admin account cannot be deleted."}), 400

    listing_count = Listing.query.filter_by(user_id=user.id).count()
    maintenance_count = Maintenance.query.filter(
        or_(Maintenance.client_id == user.id, Maintenance.artisan_id == user.id)
    ).count()
    cart_count = CartItem.query.filter_by(user_id=user.id).count()
    order_count = Order.query.filter(
        or_(Order.buyer_id == user.id, Order.seller_id == user.id)
    ).count()
    chat_count = Chat.query.filter(
        or_(Chat.buyer_id == user.id, Chat.artisan_id == user.id)
    ).count()
    message_count = ChatMessage.query.filter_by(sender_id=user.id).count()

    if listing_count > 0 or maintenance_count > 0 or cart_count > 0 or order_count > 0 or chat_count > 0 or message_count > 0:
        return jsonify({
            "error": "Cannot delete user with linked listings, cart, maintenance, orders, chats, or messages."
        }), 400

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "User deleted successfully"}), 200


@app.route('/listings', methods=['GET'])
def get_listings():
    listings = Listing.query.order_by(Listing.created_at.desc()).all()
    return jsonify([serialize_listing(item) for item in listings]), 200


@app.route('/listings/<int:listing_id>', methods=['GET'])
def get_single_listing(listing_id):
    item = Listing.query.get_or_404(listing_id)
    return jsonify(serialize_listing(item)), 200


@app.route('/listings', methods=['POST'])
@jwt_required()
def create_listing():
    user = current_user()

    image_url = request.form.get('image_url')

    if 'file' in request.files:
        file = request.files['file']
        if file and file.filename:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            image_url = f"http://127.0.0.1:5000/static/uploads/{filename}"

    title = (request.form.get('title') or '').strip()
    description = (request.form.get('description') or '').strip()
    price = request.form.get('price')
    category = (request.form.get('category') or '').strip()
    location = (request.form.get('location') or 'Thika Town').strip()
    incoming_phone = (request.form.get('phone_number') or '').strip()
    status = (request.form.get('status') or 'active').strip().lower()

    if not title or not description or not price or not category:
        return jsonify({"error": "Title, description, price, and category are required"}), 400

    try:
        price = float(price)
    except ValueError:
        return jsonify({"error": "Price must be a valid number"}), 400

    owner_phone = normalize_phone(user.phone_number)

    if not owner_phone and incoming_phone:
        owner_phone = normalize_phone(incoming_phone)
        if not owner_phone:
            return jsonify({
                "error": "Invalid phone number. Use format like 0712345678 or 254720977299."
            }), 400
        user.phone_number = owner_phone

    if not owner_phone:
        return jsonify({
            "error": "Add a valid phone number before creating a listing."
        }), 400

    new_listing = Listing(
        title=title,
        description=description,
        price=price,
        category=category,
        location=location,
        image_url=image_url,
        status=status,
        user_id=user.id
    )

    db.session.add(new_listing)
    db.session.commit()

    return jsonify({
        "message": "Listing published",
        "listing": serialize_listing(new_listing),
        "phone_number": owner_phone
    }), 201


@app.route('/admin/listings', methods=['POST'])
@jwt_required()
def admin_create_listing():
    admin = admin_required_user()
    if not admin:
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json() or {}

    title = (data.get('title') or '').strip()
    description = (data.get('description') or '').strip()
    category = (data.get('category') or '').strip()
    location = (data.get('location') or 'Thika Town').strip()
    image_url = (data.get('image_url') or '').strip()
    status = (data.get('status') or 'active').strip().lower()
    user_id = data.get('user_id')
    price = data.get('price')

    if not title or not description or not category or user_id in (None, '') or price in (None, ''):
        return jsonify({"error": "title, description, category, price and user_id are required"}), 400

    try:
        user_id = int(user_id)
        price = float(price)
    except (ValueError, TypeError):
        return jsonify({"error": "user_id and price must be valid numbers"}), 400

    owner = User.query.get(user_id)
    if not owner:
        return jsonify({"error": "Owner user not found"}), 404

    new_listing = Listing(
        title=title,
        description=description,
        price=price,
        category=category,
        location=location,
        image_url=image_url,
        status=status,
        user_id=user_id
    )

    db.session.add(new_listing)
    db.session.commit()

    return jsonify({
        "message": "Listing created successfully",
        "listing": serialize_listing(new_listing)
    }), 201


@app.route('/listings/<int:listing_id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_listing(listing_id):
    user = current_user()
    item = Listing.query.get_or_404(listing_id)

    if item.user_id != user.id and not is_admin_user(user):
        return jsonify({"error": "Unauthorized"}), 403

    if request.is_json:
        data = request.get_json() or {}

        title = (data.get('title') or item.title).strip()
        description = (data.get('description') or item.description).strip()
        category = (data.get('category') or item.category).strip()
        location = (data.get('location') or item.location).strip()
        image_url = data.get('image_url') if data.get('image_url') is not None else item.image_url
        status = (data.get('status') or item.status or 'active').strip().lower()
        price = data.get('price', item.price)
        user_id = data.get('user_id', item.user_id)

        try:
            price = float(price)
            user_id = int(user_id)
        except (TypeError, ValueError):
            return jsonify({"error": "Invalid price or user_id"}), 400

        owner = User.query.get(user_id)
        if not owner:
            return jsonify({"error": "Owner user not found"}), 404

        item.title = title
        item.description = description
        item.category = category
        item.location = location
        item.image_url = image_url
        item.status = status
        item.price = price
        item.user_id = user_id

    else:
        item.title = (request.form.get('title') or item.title).strip()
        item.description = (request.form.get('description') or item.description).strip()
        item.category = (request.form.get('category') or item.category).strip()
        item.location = (request.form.get('location') or item.location).strip()
        item.status = (request.form.get('status') or item.status or 'active').strip().lower()

        if request.form.get('price') not in (None, ''):
            try:
                item.price = float(request.form.get('price'))
            except ValueError:
                return jsonify({"error": "Price must be a valid number"}), 400

        if request.form.get('image_url') is not None:
            item.image_url = request.form.get('image_url')

        if 'file' in request.files:
            file = request.files['file']
            if file and file.filename:
                filename = secure_filename(file.filename)
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                item.image_url = f"http://127.0.0.1:5000/static/uploads/{filename}"

    db.session.commit()

    return jsonify({
        "message": "Listing updated successfully",
        "listing": serialize_listing(item)
    }), 200


@app.route('/listings/<int:listing_id>', methods=['DELETE'])
@jwt_required()
def delete_listing(listing_id):
    item = Listing.query.get_or_404(listing_id)
    user = current_user()

    if item.user_id != user.id and not is_admin_user(user):
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(item)
    db.session.commit()

    return jsonify({"message": "Deleted successfully"}), 200


@app.route('/maintenance', methods=['GET'])
@jwt_required()
def get_maintenance_tasks():
    user = current_user()

    if is_admin_user(user):
        tasks = Maintenance.query.order_by(Maintenance.created_at.desc()).all()
    else:
        tasks = Maintenance.query.filter(
            or_(
                Maintenance.client_id == user.id,
                Maintenance.artisan_id == user.id
            )
        ).order_by(Maintenance.created_at.desc()).all()

    return jsonify([serialize_maintenance(task, user.id) for task in tasks]), 200


@app.route('/maintenance', methods=['POST'])
@jwt_required()
def create_maintenance_task():
    user = current_user()
    data = request.get_json() or {}

    item = (data.get('item') or '').strip()
    description = (data.get('description') or '').strip()
    location = (data.get('location') or '').strip()
    artisan_id = data.get('artisan_id')
    phone = (data.get('phone') or '').strip()
    listing_id = data.get('listing_id')
    incoming_item_price = data.get('item_price')

    if not item:
        return jsonify({"error": "Item is required"}), 400

    if not artisan_id:
        return jsonify({"error": "artisan_id is required"}), 400

    try:
        artisan_id = int(artisan_id)
    except (TypeError, ValueError):
        return jsonify({"error": "artisan_id must be a valid integer"}), 400

    if artisan_id == user.id:
        return jsonify({"error": "You cannot assign a maintenance request to yourself"}), 400

    artisan = User.query.get(artisan_id)
    if not artisan:
        return jsonify({"error": "Assigned artisan not found"}), 404

    resolved_listing_id = None
    if listing_id not in (None, ''):
        try:
            resolved_listing_id = int(listing_id)
        except (TypeError, ValueError):
            return jsonify({"error": "listing_id must be a valid integer"}), 400

    listing = None
    item_price = 0.0

    if resolved_listing_id is not None:
        listing = Listing.query.get(resolved_listing_id)
        if not listing:
            return jsonify({"error": "Listing not found"}), 404

        if listing.user_id != artisan_id:
            return jsonify({
                "error": "The selected artisan does not own the provided listing"
            }), 400

        item_price = float(listing.price)
    else:
        if incoming_item_price in (None, ''):
            return jsonify({"error": "item_price is required when listing_id is not provided"}), 400
        try:
            item_price = float(incoming_item_price)
        except (TypeError, ValueError):
            return jsonify({"error": "item_price must be a valid number"}), 400

    normalized_phone = normalize_phone(phone)

    if not normalized_phone and listing and listing.author:
        normalized_phone = normalize_phone(listing.author.phone_number)

    if not normalized_phone and artisan.phone_number:
        normalized_phone = normalize_phone(artisan.phone_number)

    if not normalized_phone:
        return jsonify({
            "error": "No valid WhatsApp phone number was found for this maintenance request."
        }), 400

    final_item_price, maintenance_fee, total_price = calculate_maintenance_fee(item_price)

    new_task = Maintenance(
        item=item,
        description=description,
        location=location,
        status='Pending',
        client_id=user.id,
        artisan_id=artisan_id,
        phone=normalized_phone,
        listing_id=resolved_listing_id,
        item_price=final_item_price,
        maintenance_fee=maintenance_fee,
        total_price=total_price
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify({
        "message": "Maintenance task created successfully",
        "task": serialize_maintenance(new_task, user.id)
    }), 201


@app.route('/maintenance/<int:id>/status', methods=['PATCH'])
@jwt_required()
def update_maintenance_status(id):
    user = current_user()
    task = Maintenance.query.get_or_404(id)

    if task.artisan_id != user.id and not is_admin_user(user):
        return jsonify({"error": "Only the assigned artisan or admin can update status"}), 403

    data = request.get_json() or {}
    new_status = (data.get('status') or '').strip()

    allowed_statuses = ['Pending', 'In Progress', 'Completed']
    if new_status not in allowed_statuses:
        return jsonify({"error": "Invalid status value"}), 400

    task.status = new_status
    task.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        "message": "Maintenance status updated successfully",
        "task": serialize_maintenance(task, user.id)
    }), 200


@app.route('/maintenance/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_maintenance_task(id):
    user = current_user()
    task = Maintenance.query.get_or_404(id)

    if task.client_id != user.id and not is_admin_user(user):
        return jsonify({"error": "Only the client or admin can delete this maintenance task"}), 403

    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Maintenance task deleted successfully"}), 200


@app.route('/cart', methods=['GET'])
@jwt_required()
def get_cart():
    user = current_user()
    items = CartItem.query.filter_by(user_id=user.id).order_by(CartItem.created_at.desc()).all()

    subtotal = round(sum(item.total_price for item in items), 2)

    return jsonify({
        "items": [serialize_cart_item(item) for item in items],
        "subtotal": subtotal,
        "count": len(items)
    }), 200


@app.route('/cart', methods=['POST'])
@jwt_required()
def add_to_cart():
    user = current_user()
    data = request.get_json() or {}

    listing_id = data.get('listing_id')
    quantity = data.get('quantity', 1)

    if listing_id in (None, ''):
        return jsonify({"error": "listing_id is required"}), 400

    try:
        listing_id = int(listing_id)
        quantity = int(quantity)
    except (TypeError, ValueError):
        return jsonify({"error": "listing_id and quantity must be valid integers"}), 400

    if quantity < 1:
        return jsonify({"error": "quantity must be at least 1"}), 400

    listing = Listing.query.get(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    if listing.user_id == user.id:
        return jsonify({"error": "You cannot add your own listing to cart"}), 400

    if existing_item := CartItem.query.filter_by(
        user_id=user.id, listing_id=listing_id
    ).first():
        existing_item.quantity += quantity
        existing_item.unit_price = float(listing.price)
        existing_item.total_price = round(existing_item.quantity * existing_item.unit_price, 2)
        db.session.commit()

        return jsonify({
            "message": "Cart item quantity updated",
            "item": serialize_cart_item(existing_item)
        }), 200

    new_cart_item = CartItem(
        user_id=user.id,
        listing_id=listing_id,
        quantity=quantity,
        unit_price=float(listing.price),
        total_price=round(float(listing.price) * quantity, 2)
    )

    db.session.add(new_cart_item)
    db.session.commit()

    return jsonify({
        "message": "Item added to cart",
        "item": serialize_cart_item(new_cart_item)
    }), 201


@app.route('/cart/<int:item_id>', methods=['PATCH'])
@jwt_required()
def update_cart_item(item_id):
    user = current_user()
    cart_item = CartItem.query.get_or_404(item_id)

    if cart_item.user_id != user.id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json() or {}
    quantity = data.get('quantity')

    if quantity in (None, ''):
        return jsonify({"error": "quantity is required"}), 400

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return jsonify({"error": "quantity must be a valid integer"}), 400

    if quantity < 1:
        return jsonify({"error": "quantity must be at least 1"}), 400

    cart_item.quantity = quantity
    cart_item.unit_price = float(cart_item.listing.price)
    cart_item.total_price = round(cart_item.quantity * cart_item.unit_price, 2)

    db.session.commit()

    return jsonify({
        "message": "Cart item updated successfully",
        "item": serialize_cart_item(cart_item)
    }), 200


@app.route('/cart/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_cart_item(item_id):
    user = current_user()
    cart_item = CartItem.query.get_or_404(item_id)

    if cart_item.user_id != user.id:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(cart_item)
    db.session.commit()

    return jsonify({"message": "Cart item removed successfully"}), 200


@app.route('/cart/clear', methods=['DELETE'])
@jwt_required()
def clear_cart():
    user = current_user()
    CartItem.query.filter_by(user_id=user.id).delete()
    db.session.commit()

    return jsonify({"message": "Cart cleared successfully"}), 200


@app.route('/orders', methods=['GET'])
@jwt_required()
def get_orders():
    user = current_user()

    if is_admin_user(user):
        orders = Order.query.order_by(Order.created_at.desc()).all()
    else:
        orders = Order.query.filter(
            or_(
                Order.buyer_id == user.id,
                Order.seller_id == user.id
            )
        ).order_by(Order.created_at.desc()).all()

    return jsonify([serialize_order(order) for order in orders]), 200


@app.route('/orders', methods=['POST'])
@jwt_required()
def create_order():
    user = current_user()
    data = request.get_json() or {}

    listing_id = data.get('listing_id')
    quantity = data.get('quantity', 1)
    location = (data.get('location') or '').strip()
    phone = (data.get('phone') or '').strip()
    description = (data.get('description') or '').strip()

    if listing_id in (None, ''):
        return jsonify({"error": "listing_id is required"}), 400

    try:
        listing_id = int(listing_id)
        quantity = int(quantity)
    except (TypeError, ValueError):
        return jsonify({"error": "listing_id and quantity must be valid integers"}), 400

    if quantity < 1:
        return jsonify({"error": "quantity must be at least 1"}), 400

    listing = Listing.query.get(listing_id)
    if not listing:
        return jsonify({"error": "Listing not found"}), 404

    if listing.user_id == user.id:
        return jsonify({"error": "You cannot order your own listing"}), 400

    normalized_phone = normalize_phone(phone)
    if not normalized_phone and listing.author:
        normalized_phone = normalize_phone(listing.author.phone_number)

    unit_price = float(listing.price)
    total_price = round(unit_price * quantity, 2)

    new_order = Order(
        item=listing.title,
        description=description or listing.description,
        status='Pending',
        location=location,
        buyer_id=user.id,
        seller_id=listing.user_id,
        listing_id=listing.id,
        phone=normalized_phone,
        quantity=quantity,
        unit_price=unit_price,
        total_price=total_price
    )

    db.session.add(new_order)
    db.session.commit()

    return jsonify({
        "message": "Order created successfully",
        "order": serialize_order(new_order)
    }), 201


@app.route('/orders/from-cart', methods=['POST'])
@jwt_required()
def checkout_cart_to_orders():
    user = current_user()
    data = request.get_json() or {}

    location = (data.get('location') or '').strip()
    phone = (data.get('phone') or '').strip()

    cart_items = CartItem.query.filter_by(user_id=user.id).all()
    if not cart_items:
        return jsonify({"error": "Cart is empty"}), 400

    created_orders = []

    for cart_item in cart_items:
        listing = cart_item.listing
        if not listing:
            continue

        normalized_phone = normalize_phone(phone)
        if not normalized_phone and listing.author:
            normalized_phone = normalize_phone(listing.author.phone_number)

        order = Order(
            item=listing.title,
            description=listing.description,
            status='Pending',
            location=location,
            buyer_id=user.id,
            seller_id=listing.user_id,
            listing_id=listing.id,
            phone=normalized_phone,
            quantity=cart_item.quantity,
            unit_price=float(listing.price),
            total_price=round(float(listing.price) * cart_item.quantity, 2)
        )

        db.session.add(order)
        created_orders.append(order)

    CartItem.query.filter_by(user_id=user.id).delete()
    db.session.commit()

    return jsonify({
        "message": "Orders created from cart successfully",
        "orders": [serialize_order(order) for order in created_orders]
    }), 201


@app.route('/orders/<int:order_id>/status', methods=['PATCH'])
@jwt_required()
def update_order_status(order_id):
    user = current_user()
    order = Order.query.get_or_404(order_id)

    if order.seller_id != user.id and not is_admin_user(user):
        return jsonify({"error": "Only the seller or admin can update order status"}), 403

    data = request.get_json() or {}
    new_status = (data.get('status') or '').strip()

    allowed_statuses = ['Pending', 'Confirmed', 'Delivered', 'Completed', 'Cancelled']
    if new_status not in allowed_statuses:
        return jsonify({"error": "Invalid status value"}), 400

    order.status = new_status
    order.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        "message": "Order status updated successfully",
        "order": serialize_order(order)
    }), 200


@app.route('/orders/<int:order_id>', methods=['DELETE'])
@jwt_required()
def delete_order(order_id):
    user = current_user()
    order = Order.query.get_or_404(order_id)

    if order.buyer_id != user.id and not is_admin_user(user):
        return jsonify({"error": "Only the buyer or admin can delete this order"}), 403

    db.session.delete(order)
    db.session.commit()

    return jsonify({"message": "Order deleted successfully"}), 200


# =========================
# CHAT ROUTES
# =========================

@app.route('/chats', methods=['GET'])
@jwt_required()
def get_user_chats():
    user = current_user()

    chats = Chat.query.filter(
        or_(Chat.buyer_id == user.id, Chat.artisan_id == user.id)
    ).order_by(Chat.updated_at.desc()).all()

    return jsonify([serialize_chat(chat, user.id) for chat in chats]), 200


@app.route('/chats/<int:chat_id>/messages', methods=['GET'])
@jwt_required()
def get_chat_messages(chat_id):
    user = current_user()
    chat = Chat.query.get_or_404(chat_id)

    if chat.buyer_id != user.id and chat.artisan_id != user.id and not is_admin_user(user):
        return jsonify({"error": "Unauthorized"}), 403

    messages = [serialize_chat_message(message) for message in chat.messages]
    return jsonify(messages), 200


@app.route('/chats', methods=['POST'])
@jwt_required()
def create_chat():
    user = current_user()
    data = request.get_json() or {}

    buyer_id = data.get("buyer_id")
    artisan_id = data.get("artisan_id")
    order_id = data.get("order_id")
    maintenance_id = data.get("maintenance_id")

    if not buyer_id or not artisan_id:
        return jsonify({"error": "buyer_id and artisan_id are required"}), 400

    try:
        buyer_id = int(buyer_id)
        artisan_id = int(artisan_id)
        order_id = int(order_id) if order_id not in (None, '') else None
        maintenance_id = int(maintenance_id) if maintenance_id not in (None, '') else None
    except (TypeError, ValueError):
        return jsonify({"error": "buyer_id, artisan_id, order_id and maintenance_id must be valid integers"}), 400

    if user.id not in [buyer_id, artisan_id] and not is_admin_user(user):
        return jsonify({"error": "Unauthorized to create this chat"}), 403

    buyer = User.query.get(buyer_id)
    artisan = User.query.get(artisan_id)

    if not buyer or not artisan:
        return jsonify({"error": "Buyer or artisan not found"}), 404

    if order_id is not None:
        order = Order.query.get(order_id)
        if not order:
            return jsonify({"error": "Order not found"}), 404

    if maintenance_id is not None:
        maintenance = Maintenance.query.get(maintenance_id)
        if not maintenance:
            return jsonify({"error": "Maintenance task not found"}), 404

    if existing_chat := Chat.query.filter(
        and_(
            Chat.buyer_id == buyer_id,
            Chat.artisan_id == artisan_id,
            Chat.order_id == order_id,
            Chat.maintenance_id == maintenance_id,
        )
    ).first():
        return jsonify(serialize_chat(existing_chat, user.id)), 200

    chat = Chat(
        buyer_id=buyer_id,
        artisan_id=artisan_id,
        order_id=order_id,
        maintenance_id=maintenance_id
    )

    db.session.add(chat)
    db.session.commit()

    return jsonify(serialize_chat(chat, user.id)), 201


@app.route('/chats/message', methods=['POST'])
@jwt_required()
def send_chat_message():
    user = current_user()
    data = request.get_json() or {}

    chat_id = data.get("chat_id")
    text = (data.get("text") or "").strip()

    if not chat_id or not text:
        return jsonify({"error": "chat_id and text are required"}), 400

    try:
        chat_id = int(chat_id)
    except (TypeError, ValueError):
        return jsonify({"error": "chat_id must be a valid integer"}), 400

    chat = Chat.query.get(chat_id)
    if not chat:
        return jsonify({"error": "Chat not found"}), 404

    if chat.buyer_id != user.id and chat.artisan_id != user.id and not is_admin_user(user):
        return jsonify({"error": "Unauthorized"}), 403

    message = ChatMessage(
        chat_id=chat_id,
        sender_id=user.id,
        text=text
    )

    db.session.add(message)
    chat.updated_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        "message": "Message sent successfully",
        "chat_message": serialize_chat_message(message)
    }), 201


@app.route('/chats/<int:chat_id>', methods=['DELETE'])
@jwt_required()
def delete_chat(chat_id):
    user = current_user()
    chat = Chat.query.get_or_404(chat_id)

    if chat.buyer_id != user.id and chat.artisan_id != user.id and not is_admin_user(user):
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(chat)
    db.session.commit()

    return jsonify({"message": "Chat deleted successfully"}), 200


def backfill_existing_maintenance_phones():
    tasks = Maintenance.query.all()
    updated = False

    for task in tasks:
        if task.phone:
            if current_phone := normalize_phone(task.phone):
                if task.phone == current_phone:
                    continue

                task.phone = current_phone
                updated = True
        resolved_phone = ''

        if task.listing and task.listing.author and task.listing.author.phone_number:
            resolved_phone = normalize_phone(task.listing.author.phone_number)

        if not resolved_phone and task.artisan_user and task.artisan_user.phone_number:
            resolved_phone = normalize_phone(task.artisan_user.phone_number)

        if resolved_phone:
            task.phone = resolved_phone
            updated = True

    if updated:
        db.session.commit()


def backfill_existing_maintenance_prices():
    tasks = Maintenance.query.all()
    updated = False

    for task in tasks:
        current_item_price = float(task.item_price or 0)
        current_fee = float(task.maintenance_fee or 0)
        current_total = float(task.total_price or 0)

        if current_item_price > 0 and current_fee > 0 and current_total > 0:
            continue

        base_price = 0.0
        if task.listing:
            base_price = float(task.listing.price or 0)

        item_price, fee, total = calculate_maintenance_fee(base_price)
        task.item_price = item_price
        task.maintenance_fee = fee
        task.total_price = total
        updated = True

    if updated:
        db.session.commit()


if __name__ == '__main__':
    with app.app_context():
        db.create_all()

        inspector = db.inspect(db.engine)

        listing_columns = [col['name'] for col in inspector.get_columns('listing')]
        if 'status' not in listing_columns:
            db.session.execute(db.text("ALTER TABLE listing ADD COLUMN status VARCHAR(30) DEFAULT 'active'"))
            db.session.commit()

        maintenance_columns = [col['name'] for col in inspector.get_columns('maintenance')]
        if 'phone' not in maintenance_columns:
            db.session.execute(db.text("ALTER TABLE maintenance ADD COLUMN phone VARCHAR(30)"))
            db.session.commit()

        inspector = db.inspect(db.engine)
        maintenance_columns = [col['name'] for col in inspector.get_columns('maintenance')]
        if 'listing_id' not in maintenance_columns:
            db.session.execute(db.text("ALTER TABLE maintenance ADD COLUMN listing_id INTEGER"))
            db.session.commit()

        inspector = db.inspect(db.engine)
        maintenance_columns = [col['name'] for col in inspector.get_columns('maintenance')]
        if 'item_price' not in maintenance_columns:
            db.session.execute(db.text("ALTER TABLE maintenance ADD COLUMN item_price FLOAT DEFAULT 0"))
            db.session.commit()
        if 'maintenance_fee' not in maintenance_columns:
            db.session.execute(db.text("ALTER TABLE maintenance ADD COLUMN maintenance_fee FLOAT DEFAULT 0"))
            db.session.commit()
        if 'total_price' not in maintenance_columns:
            db.session.execute(db.text("ALTER TABLE maintenance ADD COLUMN total_price FLOAT DEFAULT 0"))
            db.session.commit()

        inspector = db.inspect(db.engine)
        existing_tables = inspector.get_table_names()

        if 'cart_item' not in existing_tables:
            CartItem.__table__.create(db.engine)

        if 'order' not in existing_tables:
            Order.__table__.create(db.engine)

        if 'chat' not in existing_tables:
            Chat.__table__.create(db.engine)

        if 'chat_message' not in existing_tables:
            ChatMessage.__table__.create(db.engine)

        backfill_existing_maintenance_phones()
        backfill_existing_maintenance_prices()

    app.run(port=5000, debug=True)