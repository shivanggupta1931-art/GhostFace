from fastapi import APIRouter, HTTPException, Depends
from backend.db.schemas import UserLogin, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Pre-defined mock credentials for easy hackathon testing
USERS = {
    "admin": {"id": 1, "username": "admin", "role": "ADMIN", "password": "password123"},
    "investigator": {"id": 2, "username": "investigator", "role": "ADMIN", "password": "password123"},
    "capture_user": {"id": 3, "username": "capture_user", "role": "CAPTURE_USER", "password": "password123"},
    "phone_a": {"id": 4, "username": "phone_a", "role": "CAPTURE_USER", "password": "password123"},
}

@router.post("/login", response_model=TokenResponse)
def login(creds: UserLogin):
    user = USERS.get(creds.username.lower())
    if not user or user["password"] != creds.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return TokenResponse(
        access_token=f"ghostframe-mock-token-{user['username']}",
        token_type="bearer",
        user=UserResponse(id=user["id"], username=user["username"], role=user["role"])
    )

@router.get("/me", response_model=UserResponse)
def get_current_user(token: str = "ghostframe-mock-token-admin"):
    # Simple token decoder for hackathon MVP
    username = token.replace("ghostframe-mock-token-", "")
    user = USERS.get(username, USERS["admin"])
    return UserResponse(id=user["id"], username=user["username"], role=user["role"])
