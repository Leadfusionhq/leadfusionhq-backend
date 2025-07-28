import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/middleware/check-auth';
import { validateUserSchema } from '@/request-schemas/user-schema';
import { createUser , getAllUsersByRole} from '@/services/user-service';
import { authorizedRoles } from '@/middleware/authorized-roles';



export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, companyName, phoneNumber, zipCode } = await req.json();

    const validationResponse = validateUserSchema({
      name,
      email,
      password,
      role,
      companyName,
      phoneNumber,
      zipCode
    });

    if (validationResponse instanceof NextResponse) {
      return validationResponse;
    }

    const authResponse = await checkAuth(req); 
    if (authResponse instanceof NextResponse) {
      return authResponse;
    }

    const authorizedResponse = authorizedRoles(['Admin'])(req);
    if (authorizedResponse instanceof NextResponse) {
      return authorizedResponse;
    }

    const userData = { name, email, password, role, companyName, phoneNumber, zipCode };

    const newUser = await createUser(userData);
    return NextResponse.json({ message: 'User Added successfully', user: newUser }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/user/add:', error);
    return NextResponse.json({
      error: 'Server error',
      details: process.env.NODE_ENV === 'production'
        ? 'Unknown error'
        : error instanceof Error
        ? error.message
        : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {

    const authResponse = await checkAuth(req);
    if (authResponse instanceof NextResponse) {
      return authResponse;
    }

    const authorizedResponse = authorizedRoles(['Admin'])(req);
    if (authorizedResponse instanceof NextResponse) {
      return authorizedResponse;
    }

    const url = new URL(req.url);
    const role = url.searchParams.get('role') || undefined;
    // const isActive = url.searchParams.get('isActive') === 'true';
    const isActive = true;
    console.log('isActive',isActive);

    // const users = await getAllUsersByRole(role, isActive);
    const users = await getAllUsersByRole({ role, isActive });

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Users fetched successfully',
      data: users,
    }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error);
    return NextResponse.json({
      error: 'Server error',
      details: process.env.NODE_ENV === 'production'
        ? 'Unknown error'
        : error instanceof Error
        ? error.message
        : 'Unknown error',
    }, { status: 500 });
  }
}

