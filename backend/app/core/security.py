from passlib.context import CryptContext
from jose import jwt
from app.core.settings import settings
from datetime import datetime, timedelta, timezone


SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_contex = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str):
    return pwd_contex.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    return pwd_contex.verify(plain_password, hashed_password)


def create_access_token(data: dict, expired_time: timedelta = None):
    to_encode = data.copy()
    to_encode.setdefault("type", "access")
    expire = datetime.now(timezone.utc) + (expired_time if expired_time
                                           else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def create_refresh_token(user_id: int):
    return create_access_token({
        "sub": str(user_id),
        "type": "refresh",
    }, expired_time=timedelta(days=7))

def decode_access_token(token: str):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload