from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from datetime import datetime
from urllib.parse import quote

metadata = MetaData()
db = SQLAlchemy(metadata=metadata)

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)
    is_artisan = db.Column(db.Boolean, default=False)

    # Relationships
    listings = db.relationship('Listing', backref='owner', lazy=True)
    # This links the user to the repairs assigned to them
    maintenance_tasks = db.relationship('Maintenance', backref='artisan', lazy=True)

    def to_dict(self):
        return {
            "id": self.id, 
            "username": self.username, 
            "email": self.email, 
            "phone_number": self.phone_number,
            "is_artisan": self.is_artisan
        }

class Listing(db.Model):
    __tablename__ = 'listings'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    price = db.Column(db.Float, nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String(50))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def get_whatsapp_url(self):
        if not self.owner.phone_number:
            return None
        clean_phone = "".join(filter(str.isdigit, self.owner.phone_number))
        message = f"Hello {self.owner.username}, I'm interested in your listing: {self.title}."
        return f"https://wa.me/{clean_phone}?text={quote(message)}"

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "price": self.price,
            "description": self.description,
            "category": self.category,
            "owner_id": self.user_id,
            "whatsapp_url": self.get_whatsapp_url()
        }

class Maintenance(db.Model):
    __tablename__ = 'maintenance'
    id = db.Column(db.Integer, primary_key=True)
    item_title = db.Column(db.String(100), nullable=False)
    client_name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='Pending') # Pending, In Progress, Completed
    price = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Foreign Key linking to the Artisan (User)
    artisan_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "item": self.item_title,
            "client": self.client_name,
            "phone": self.phone_number,
            "status": self.status,
            "price": self.price,
            "date": self.created_at.isoformat(),
            "artisan_id": self.artisan_id
        }