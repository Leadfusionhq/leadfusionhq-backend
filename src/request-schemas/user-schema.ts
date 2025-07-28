import { NextResponse } from 'next/server';

export const validateUserSchema = (data: { name: string, email: string, password: string, role: string, companyName?: string, phoneNumber?: string, zipCode?: string }) => {
  const { name, email, password, role, companyName, phoneNumber, zipCode } = data;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
  }

  if (role !== 'Admin' && (!companyName || !phoneNumber || !zipCode)) {
    return NextResponse.json({
      error: 'Company name, phone number, and zip code are required for users or if role is null',
    }, { status: 400 });
  }

  return null;
};



export const validateUserUpdateSchema = (data: { name: string, email: string, password: string, role: string, companyName?: string, phoneNumber?: string, zipCode?: string }) => {
  const {  name, email, password, role, companyName, phoneNumber, zipCode } = data;

  if (!name || !email) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }
 if (password) {
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
  }

  if(password){
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
    }
  }

  if (role !== 'Admin' && (!companyName || !phoneNumber || !zipCode)) {
    return NextResponse.json({
      error: 'Company name, phone number, and zip code are required for users or if role is null',
    }, { status: 400 });
  }

  return null;
};