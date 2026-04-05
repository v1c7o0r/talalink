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
from flask_mail import Mail, Message
from werkzeug.utils import secure_filename
from sqlalchemy import or_

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

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client_user = db.relationship('User', foreign_keys=[client_id], backref='maintenance_requests')
    artisan_user = db.relationship('User', foreign_keys=[artisan_id], backref='assigned_maintenance')


def serialize_maintenance(task, current_user_id):
    if current_user_id == task.artisan_id:
        contact_phone = task.client_user.phone_number if task.client_user else ""
    else:
        contact_phone = task.artisan_user.phone_number if task.artisan_user else ""

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
        "phone": contact_phone or "",
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "updated_at": task.updated_at.isoformat() if task.updated_at else None
    }


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
            "/maintenance"
        ]
    })


@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}

    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400

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
        verification_token=verification_token,
        is_verified=True
    )

    db.session.add(new_user)
    db.session.commit()

    try:
        msg = Message(
            'Verify your TalaLink Account',
            sender='noreply@talalink.com',
            recipients=[email]
        )
        msg.body = f"Verify your account here: http://localhost:3000/verify/{verification_token}"
    except Exception as e:
        print(f"Mail delivery failed: {e}")

    return jsonify({"message": "Signup successful. Check email to verify."}), 201


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
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email
            }
        }), 200

    return jsonify({"error": "Invalid email or password"}), 401


@app.route('/profile', methods=['GET', 'PUT'])
@jwt_required()
def handle_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    if request.method == 'GET':
        return jsonify({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "phone_number": user.phone_number or ""
        }), 200

    data = request.get_json() or {}
    user.phone_number = (data.get('phone_number') or user.phone_number or '').strip()

    db.session.commit()
    return jsonify({"message": "Profile updated successfully"}), 200


@app.route('/listings', methods=['GET'])
def get_listings():
    listings = Listing.query.order_by(Listing.created_at.desc()).all()

    output = []
    output.extend(
        {
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "price": item.price,
            "category": item.category,
            "location": item.location,
            "image_url": item.image_url,
            "user_id": item.user_id,
            "phone_number": item.author.phone_number if item.author else None,
            "author_username": item.author.username if item.author else None,
            "created_at": (
                item.created_at.isoformat() if item.created_at else None
            ),
        }
        for item in listings
    )
    return jsonify(output), 200


@app.route('/listings/<int:id>', methods=['GET'])
def get_listing(id):
    item = Listing.query.get_or_404(id)

    return jsonify({
        "id": item.id,
        "title": item.title,
        "description": item.description,
        "price": item.price,
        "category": item.category,
        "location": item.location,
        "image_url": item.image_url,
        "user_id": item.user_id,
        "phone_number": item.author.phone_number if item.author else None,
        "author_username": item.author.username if item.author else None,
        "created_at": item.created_at.isoformat() if item.created_at else None
    }), 200


@app.route('/listings', methods=['POST'])
@jwt_required()
def create_listing():
    user_id = int(get_jwt_identity())

    image_url = request.form.get('image_url')

    if 'file' in request.files:
        file = request.files['file']
        if file and file.filename:
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            image_url = f"http://127.0.0.1:5000/static/uploads/{filename}"

    title = request.form.get('title')
    description = request.form.get('description')
    price = request.form.get('price')
    category = request.form.get('category')
    location = request.form.get('location') or 'Thika Town'

    if not title or not description or not price or not category:
        return jsonify({"error": "Title, description, price, and category are required"}), 400

    try:
        price = float(price)
    except ValueError:
        return jsonify({"error": "Price must be a valid number"}), 400

    new_listing = Listing(
        title=title,
        description=description,
        price=price,
        category=category,
        location=location,
        image_url=image_url,
        user_id=user_id
    )

    db.session.add(new_listing)
    db.session.commit()

    return jsonify({
        "message": "Listing published",
        "listing_id": new_listing.id
    }), 201


@app.route('/listings/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_listing(id):
    item = Listing.query.get_or_404(id)
    current_user_id = int(get_jwt_identity())

    if item.user_id != current_user_id:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(item)
    db.session.commit()

    return jsonify({"message": "Deleted successfully"}), 200


@app.route('/maintenance', methods=['GET'])
@jwt_required()
def get_maintenance_tasks():
    user_id = int(get_jwt_identity())

    tasks = Maintenance.query.filter(
        or_(
            Maintenance.client_id == user_id,
            Maintenance.artisan_id == user_id
        )
    ).order_by(Maintenance.created_at.desc()).all()

    return jsonify([serialize_maintenance(task, user_id) for task in tasks]), 200


@app.route('/maintenance', methods=['POST'])
@jwt_required()
def create_maintenance_task():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    item = (data.get('item') or '').strip()
    description = (data.get('description') or '').strip()
    location = (data.get('location') or '').strip()
    artisan_id = data.get('artisan_id')

    if not item:
        return jsonify({"error": "Item is required"}), 400

    if not artisan_id:
        return jsonify({"error": "artisan_id is required"}), 400

    try:
        artisan_id = int(artisan_id)
    except (TypeError, ValueError):
        return jsonify({"error": "artisan_id must be a valid integer"}), 400

    if artisan_id == user_id:
        return jsonify({"error": "You cannot assign a maintenance request to yourself"}), 400

    artisan = User.query.get(artisan_id)
    if not artisan:
        return jsonify({"error": "Assigned artisan not found"}), 404

    new_task = Maintenance(
        item=item,
        description=description,
        location=location,
        status='Pending',
        client_id=user_id,
        artisan_id=artisan_id
    )

    db.session.add(new_task)
    db.session.commit()

    return jsonify({
        "message": "Maintenance task created successfully",
        "task": serialize_maintenance(new_task, user_id)
    }), 201


@app.route('/maintenance/<int:id>/status', methods=['PATCH'])
@jwt_required()
def update_maintenance_status(id):
    user_id = int(get_jwt_identity())
    task = Maintenance.query.get_or_404(id)

    if task.artisan_id != user_id:
        return jsonify({"error": "Only the assigned artisan can update status"}), 403

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
        "task": serialize_maintenance(task, user_id)
    }), 200


@app.route('/maintenance/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_maintenance_task(id):
    user_id = int(get_jwt_identity())
    task = Maintenance.query.get_or_404(id)

    if task.client_id != user_id:
        return jsonify({"error": "Only the client can delete this maintenance task"}), 403

    db.session.delete(task)
    db.session.commit()

    return jsonify({"message": "Maintenance task deleted successfully"}), 200


if __name__ == '__main__':
    with app.app_context():
        db.create_all()

    app.run(port=5000, debug=True)