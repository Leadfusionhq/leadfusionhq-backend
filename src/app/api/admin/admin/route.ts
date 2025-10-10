import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/middleware/check-auth';
import { validateUserSchema } from '@/request-schemas/user-schema';
import { createAdmin , getAllUsersByRole} from '@/services/admin-service';
import { authorizedRoles } from '@/middleware/authorized-roles';



export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, phoneNumber,  companyName,address } = await req.json();

    const validationResponse = validateUserSchema({
      name,
      email,
      password,
      role,
      phoneNumber,
      companyName,
      address
    });

    if (validationResponse instanceof NextResponse) {
      return validationResponse;
    }

    const authResponse = await checkAuth(req); 
    if (authResponse instanceof NextResponse) {
      return authResponse;
    }

    const authorizedResponse = authorizedRoles(['ADMIN'])(req);
    if (authorizedResponse instanceof NextResponse) {
      return authorizedResponse;
    }

    const userData = { name, email, password, role, phoneNumber };

    const newUser = await createAdmin(userData);
    return NextResponse.json({ message: 'Admin Added successfully', user: newUser }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/admin/admin/add:', error);
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

    const authorizedResponse = authorizedRoles(['ADMIN'])(req);
    if (authorizedResponse instanceof NextResponse) {
      return authorizedResponse;
    }

    const role = 'ADMIN';
    // const isActive = url.searchParams.get('isActive') === 'true';
    const isActive = true;
    console.log('isActive',isActive);

    // const users = await getAllUsersByRole(role, isActive);
    const users = await getAllUsersByRole({ role, isActive });

    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'No admin found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Admin fetched successfully',
      data: users,
    }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/admin/admin:', error);
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

