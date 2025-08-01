import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/middleware/check-auth';
import { authorizedRoles } from '@/middleware/authorized-roles';
import { deleteUser, getUserByID, updateUser } from '@/services/user-service';
import { validateUserUpdateSchema } from '@/request-schemas/user-schema';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const auth = await checkAuth(req);
    if (auth instanceof NextResponse) return auth;

    const authz = authorizedRoles(['ADMIN'])(req);
    if (authz instanceof NextResponse) return authz;

    const user = await getUserByID(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ user }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Server error', details: err instanceof Error ? err.message : err },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const body = await req.json();
    const validation = validateUserUpdateSchema(body);
    if (validation instanceof NextResponse) return validation;

    const auth = await checkAuth(req);
    if (auth instanceof NextResponse) return auth;

    const authz = authorizedRoles(['ADMIN'])(req);
    if (authz instanceof NextResponse) return authz;

    const updated = await updateUser(userId, body);
    return NextResponse.json({ message: 'User updated', user: updated }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Server error', details: err instanceof Error ? err.message : err },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  try {
    const auth = await checkAuth(req);
    if (auth instanceof NextResponse) return auth;

    const authz = authorizedRoles(['ADMIN'])(req);
    if (authz instanceof NextResponse) return authz;

    const user = await getUserByID(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await deleteUser(userId);
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Server error', details: err instanceof Error ? err.message : err },
      { status: 500 }
    );
  }
}
