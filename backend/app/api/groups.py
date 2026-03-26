"""
API Router - Groups (Faculty project group management)
"""
import uuid
import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.connection import get_db
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.group import Group
from app.utils.dependencies import get_current_user

router = APIRouter()


# ----- Schemas (inline for simplicity) -----
class GroupCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class GroupUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)


class GroupResponse(BaseModel):
    id: uuid.UUID
    name: str
    owner_id: uuid.UUID
    project_count: int = 0
    model_config = {"from_attributes": True}


class ProjectInGroupResponse(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    team_name: Optional[str] = None
    model_config = {"from_attributes": True}


class GroupDetailResponse(BaseModel):
    id: uuid.UUID
    name: str
    owner_id: uuid.UUID
    projects: List[ProjectInGroupResponse] = []
    model_config = {"from_attributes": True}


@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    data: GroupCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new group. Faculty only."""
    if current_user.role not in (UserRole.PROFESSOR, UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Only faculty can create groups")

    group = Group(name=data.name, owner_id=current_user.id)
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return GroupResponse(id=group.id, name=group.name, owner_id=group.owner_id, project_count=0)


@router.get("/", response_model=List[GroupResponse])
async def list_groups(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all groups owned by the current faculty member."""
    stmt = (
        select(Group)
        .options(selectinload(Group.projects))
        .where(Group.owner_id == current_user.id)
        .order_by(desc(Group.created_at))
    )
    result = await db.execute(stmt)
    groups = result.scalars().all()
    return [
        GroupResponse(
            id=g.id,
            name=g.name,
            owner_id=g.owner_id,
            project_count=len(g.projects),
        )
        for g in groups
    ]


@router.get("/{group_id}", response_model=GroupDetailResponse)
async def get_group(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get group detail including projects."""
    stmt = (
        select(Group)
        .options(selectinload(Group.projects))
        .where(Group.id == group_id, Group.owner_id == current_user.id)
    )
    result = await db.execute(stmt)
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    return GroupDetailResponse(
        id=group.id,
        name=group.name,
        owner_id=group.owner_id,
        projects=[
            ProjectInGroupResponse(
                id=p.id,
                title=p.title,
                status=p.status.value,
                team_name=p.team_name,
            )
            for p in group.projects
        ],
    )


@router.put("/{group_id}", response_model=GroupResponse)
async def rename_group(
    group_id: uuid.UUID,
    data: GroupUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rename a group."""
    result = await db.execute(
        select(Group).options(selectinload(Group.projects)).where(Group.id == group_id, Group.owner_id == current_user.id)
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if data.name:
        group.name = data.name
    await db.commit()
    await db.refresh(group)
    return GroupResponse(id=group.id, name=group.name, owner_id=group.owner_id, project_count=len(group.projects))


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a group (projects retain their data, just lose the group association)."""
    result = await db.execute(
        select(Group).options(selectinload(Group.projects)).where(Group.id == group_id, Group.owner_id == current_user.id)
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Detach projects from group
    for p in group.projects:
        p.group_id = None
    await db.delete(group)
    await db.commit()


class BulkProjects(BaseModel):
    project_ids: List[uuid.UUID]


@router.post("/{group_id}/projects/bulk", status_code=status.HTTP_200_OK)
async def add_projects_to_group_bulk(
    group_id: uuid.UUID,
    data: BulkProjects,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Assign multiple existing projects to a group."""
    import logging
    logger = logging.getLogger("aspes")
    logger.info(f"Adding bulk projects. Group: {group_id}, Projects: {data.project_ids}")
    group_result = await db.execute(
        select(Group).where(Group.id == group_id, Group.owner_id == current_user.id)
    )
    group = group_result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    project_result = await db.execute(
        select(Project).where(
            Project.id.in_(data.project_ids), Project.owner_id == current_user.id
        )
    )
    projects = project_result.scalars().all()
    
    if not projects:
        raise HTTPException(status_code=404, detail="No projects found")

    for project in projects:
        project.group_id = group_id
    
    await db.commit()
    return {"message": f"Added {len(projects)} projects to group"}


@router.post("/{group_id}/projects/{project_id}", status_code=status.HTTP_200_OK)
async def add_project_to_group(
    group_id: uuid.UUID,
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Assign an existing project to a group."""
    group_result = await db.execute(
        select(Group).where(Group.id == group_id, Group.owner_id == current_user.id)
    )
    group = group_result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    project_result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == current_user.id)
    )
    project = project_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.group_id = group_id
    await db.commit()
    return {"message": "Project added to group"}




@router.delete("/{group_id}/projects/{project_id}", status_code=status.HTTP_200_OK)
async def remove_project_from_group(
    group_id: uuid.UUID,
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a project from a group."""
    project_result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id,
            Project.group_id == group_id,
        )
    )
    project = project_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found in this group")

    project.group_id = None
    await db.commit()
    return {"message": "Project removed from group"}
