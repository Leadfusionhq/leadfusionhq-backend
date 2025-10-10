import { NextResponse } from 'next/server';

interface AddressData {
  full_address: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  place_id?: string;
}

interface UserRegistrationData {
  name: string;
  email: string;
  password: string;
  role?: string;
  companyName: string;
  phoneNumber: string;
  address: AddressData;
}

interface UserUpdateData {
  name: string;
  email: string;
  password?: string;
  role?: string;
  companyName?: string;
  phoneNumber?: string;
  address?: AddressData;
}

export const validateUserSchema = (data: UserRegistrationData) => {
  const { name, email, password, role, companyName, phoneNumber, address } = data;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
  }

  if (role !== 'ADMIN') {
    if (!companyName || !phoneNumber) {
      return NextResponse.json({
        error: 'Company name and phone number are required for users',
      }, { status: 400 });
    }

    if (!address) {
      return NextResponse.json({
        error: 'Address information is required',
      }, { status: 400 });
    }

    // Validate address components
    if (!address.full_address || !address.street || !address.city || !address.state || !address.zip_code) {
      return NextResponse.json({
        error: 'Complete address (street, city, state, ZIP code) is required',
      }, { status: 400 });
    }

    // Validate state format (must be 2-letter code)
    if (address.state.length !== 2) {
      return NextResponse.json({
        error: 'State must be a 2-letter code (e.g., CA, NY, TX)',
      }, { status: 400 });
    }

    // Validate ZIP code format
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(address.zip_code)) {
      return NextResponse.json({
        error: 'ZIP code must be in format 12345 or 12345-6789',
      }, { status: 400 });
    }
  }

  return null;
};

export const validateUserUpdateSchema = (data: UserUpdateData) => {
  const { name, email, password, role, companyName, phoneNumber, address } = data;

  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  if (password && password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
  }

  if (role !== 'ADMIN') {
    if (!companyName || !phoneNumber) {
      return NextResponse.json({
        error: 'Company name and phone number are required for users',
      }, { status: 400 });
    }

    // Validate address if provided
    if (address) {
      if (!address.full_address || !address.street || !address.city || !address.state || !address.zip_code) {
        return NextResponse.json({
          error: 'Complete address (street, city, state, ZIP code) is required',
        }, { status: 400 });
      }

      // Validate state format
      if (address.state.length !== 2) {
        return NextResponse.json({
          error: 'State must be a 2-letter code (e.g., CA, NY, TX)',
        }, { status: 400 });
      }

      // Validate ZIP code format
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(address.zip_code)) {
        return NextResponse.json({
          error: 'ZIP code must be in format 12345 or 12345-6789',
        }, { status: 400 });
      }
    }
  }

  return null;
};