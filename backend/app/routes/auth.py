from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models import User
import uuid

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    """User registration"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400
    
    username = data['username']
    password = data['password']
    
    # Check if user exists
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 409
    
    # Create new user
    user = User(
        id=str(uuid.uuid4()),
        username=username
    )
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    # Generate token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'token': access_token,
        'userId': user.id,
        'expiresIn': 86400  # 24 hours in seconds
    }), 201


@bp.route('/login', methods=['POST'])
def login():
    """User login"""
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400
    
    username = data['username']
    password = data['password']
    
    # Find user
    user = User.query.filter_by(username=username).first()
    
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid username or password'}), 401
    
    # Generate token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'token': access_token,
        'userId': user.id,
        'expiresIn': 86400  # 24 hours in seconds
    }), 200


@bp.route('/bind-wechat', methods=['POST'])
@jwt_required()
def bind_wechat():
    """Bind WeChat ID to user account"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('wechat_id'):
        return jsonify({'error': 'WeChat ID is required'}), 400
    
    wechat_id = data['wechat_id']
    
    # Check if WeChat ID is already bound
    existing = User.query.filter_by(wechat_id=wechat_id).first()
    if existing and existing.id != user_id:
        return jsonify({'error': 'WeChat ID already bound to another account'}), 409
    
    # Update user
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.wechat_id = wechat_id
    db.session.commit()
    
    return jsonify({'message': 'WeChat ID bound successfully'}), 200


@bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict()), 200
