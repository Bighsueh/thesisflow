from fastapi import APIRouter, Depends, HTTPException, Query
from db import get_db
import schemas
from auth import get_current_user
from services import presign_upload, presign_get
import models

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

@router.post("/presign", response_model=schemas.PresignResponse)
def presign(
    payload: schemas.PresignRequest,
    current_user: models.User = Depends(get_current_user)
):
    url, object_key = presign_upload(payload.filename, payload.content_type)
    return schemas.PresignResponse(upload_url=url, object_key=object_key)

@router.get("/presign/get", response_model=schemas.PresignGetResponse)
def presign_get_url(
    object_key: str = Query(...),
    current_user: models.User = Depends(get_current_user)
):
    url = presign_get(object_key)
    return schemas.PresignGetResponse(download_url=url)

@router.delete("")
def delete_upload(
    path: str = Query(None),
    current_user: models.User = Depends(get_current_user)
):
    # TODO: 實現實際的文件刪除邏輯（從 MinIO 刪除）
    # 目前只返回成功，實際刪除需要實現 MinIO 客戶端刪除功能
    if not path:
        raise HTTPException(status_code=400, detail="path query parameter is required")
    return {"deleted": True, "path": path}
