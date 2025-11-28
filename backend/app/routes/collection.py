from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Collection
from app.services.ai_service import analyze_text
import uuid

bp = Blueprint('collection', __name__)

@bp.route('/collect', methods=['POST'])
@jwt_required()
def collect():
    """Collect text content"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or not data.get('text'):
        return jsonify({'error': 'Text content is required'}), 400
    
    text = data['text']
    source_app = data.get('source_app')
    source_url = data.get('source_url')
    
    # Call AI service to analyze text
    try:
        ai_result = analyze_text(text)
        keywords = ai_result.get('keywords', [])
        category = ai_result.get('category', 'Uncategorized')
    except Exception as e:
        current_app.logger.error(f"AI service error: {str(e)}")
        # Fallback: save without AI analysis
        keywords = []
        category = 'Uncategorized'
    
    # Create collection
    collection = Collection(
        id=str(uuid.uuid4()),
        user_id=user_id,
        original_text=text,
        keywords=keywords,
        category=category,
        source_app=source_app,
        source_url=source_url
    )
    
    db.session.add(collection)
    db.session.commit()
    
    return jsonify({
        'id': collection.id,
        'keywords': keywords,
        'category': category,
        'message': 'Collection saved successfully'
    }), 201


@bp.route('/list', methods=['GET'])
@jwt_required()
def list_collections():
    """Get user's collections with pagination"""
    user_id = get_jwt_identity()
    
    page = request.args.get('page', 0, type=int)
    page_size = request.args.get('pageSize', current_app.config['DEFAULT_PAGE_SIZE'], type=int)
    
    # Limit page size
    page_size = min(page_size, current_app.config['MAX_PAGE_SIZE'])
    
    # Query collections
    query = Collection.query.filter_by(user_id=user_id).order_by(Collection.created_at.desc())
    
    # Pagination
    offset = page * page_size
    collections = query.offset(offset).limit(page_size).all()
    total = query.count()
    
    return jsonify({
        'items': [c.to_dict() for c in collections],
        'page': page,
        'pageSize': page_size,
        'total': total,
        'hasMore': (offset + page_size) < total
    }), 200


@bp.route('/<collection_id>', methods=['GET'])
@jwt_required()
def get_collection(collection_id):
    """Get collection detail"""
    user_id = get_jwt_identity()
    
    collection = Collection.query.filter_by(id=collection_id, user_id=user_id).first()
    
    if not collection:
        return jsonify({'error': 'Collection not found'}), 404
    
    return jsonify(collection.to_dict(include_text=True)), 200


@bp.route('/<collection_id>', methods=['DELETE'])
@jwt_required()
def delete_collection(collection_id):
    """Delete collection"""
    user_id = get_jwt_identity()
    
    collection = Collection.query.filter_by(id=collection_id, user_id=user_id).first()
    
    if not collection:
        return jsonify({'error': 'Collection not found'}), 404
    
    db.session.delete(collection)
    db.session.commit()
    
    return jsonify({'message': 'Collection deleted successfully'}), 200


@bp.route('/search', methods=['GET'])
@jwt_required()
def search_collections():
    """Search collections by keyword or category"""
    user_id = get_jwt_identity()
    
    keyword = request.args.get('keyword', '').strip()
    category = request.args.get('category', '').strip()
    page = request.args.get('page', 0, type=int)
    page_size = request.args.get('pageSize', current_app.config['DEFAULT_PAGE_SIZE'], type=int)
    
    # Limit page size
    page_size = min(page_size, current_app.config['MAX_PAGE_SIZE'])
    
    # Build query
    query = Collection.query.filter_by(user_id=user_id)
    
    if category:
        query = query.filter(Collection.category == category)
    
    if keyword:
        # Search in keywords array or original text
        query = query.filter(
            db.or_(
                Collection.keywords.contains([keyword]),
                Collection.original_text.ilike(f'%{keyword}%')
            )
        )
    
    query = query.order_by(Collection.created_at.desc())
    
    # Pagination
    offset = page * page_size
    collections = query.offset(offset).limit(page_size).all()
    total = query.count()
    
    return jsonify({
        'items': [c.to_dict(include_text=True) for c in collections],
        'page': page,
        'pageSize': page_size,
        'total': total,
        'hasMore': (offset + page_size) < total
    }), 200
