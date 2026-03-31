from fastapi import APIRouter
from fastapi.params import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

from app.schemas.user import (UserRegister, UserRegisterResponse, UserLogin, UserLoginResponse,
                              UserMeResponse, UserRefresh, UserRefreshResponse, UserLogoutResponse)

from app.services.auth_service import register_user, login_user, logout_user, get_me

from app.dependencies.dependencies import get_current_user

from app.models.user import User

from app.services.auth_service import refresh_token


router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
async def register(new_user: UserRegister,
                    db: AsyncSession = Depends(get_db)
                    ) -> UserRegisterResponse:
    return await register_user(new_user, db)


@router.post("/login")
async def login(user_data: UserLogin,
                db: AsyncSession = Depends(get_db)
                ) -> UserLoginResponse:
    return await login_user(user_data, db)


@router.get("/me", response_model=UserMeResponse)
async def me(current_user: User = Depends(get_current_user),
              db: AsyncSession = Depends(get_db)):
    return await get_me(current_user, db)


@router.post("/refresh")
async def refresh(ref_token: UserRefresh,
                  db: AsyncSession = Depends(get_db)
                  ) -> UserRefreshResponse:
    return await refresh_token(ref_token, db)


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user),
                 db: AsyncSession = Depends(get_db)) -> UserLogoutResponse:
    await logout_user(current_user, db)
    return {"message": "Successfully logged out"}