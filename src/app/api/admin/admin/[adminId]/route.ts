import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/middleware/check-auth';
import { authorizedRoles } from '@/middleware/authorized-roles';
import { deleteUser, getUserByID, updateUser } from '@/services/admin-service';
import { validateUserUpdateSchema } from '@/request-schemas/user-schema';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  const { adminId } = await params;
  try {
    const auth = await checkAuth(req);
    if (auth instanceof NextResponse) return auth;

    const authz = authorizedRoles(['Admin'])(req);
    if (authz instanceof NextResponse) return authz;

    const user = await getUserByID(adminId);
    if (!user) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
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
  { params }: { params: Promise<{ adminId: string }> }
) {
  const { adminId } = await params;
  try {
    const body = await req.json();
    const validation = validateUserUpdateSchema(body);
    if (validation instanceof NextResponse) return validation;

    const auth = await checkAuth(req);
    if (auth instanceof NextResponse) return auth;

    const authz = authorizedRoles(['Admin'])(req);
    if (authz instanceof NextResponse) return authz;

    const updated = await updateUser(adminId, body);
    return NextResponse.json({ message: 'Admin updated', user: updated }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Server error', details: err instanceof Error ? err.message : err },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  const { adminId } = await params;
  try {
    const auth = await checkAuth(req);
    if (auth instanceof NextResponse) return auth;

    const authz = authorizedRoles(['Admin'])(req);
    if (authz instanceof NextResponse) return authz;

    const user = await getUserByID(adminId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await deleteUser(adminId);
    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: 'Server error', details: err instanceof Error ? err.message : err },
      { status: 500 }
    );
  }
}
