import bcrypt from 'bcrypt';
import { User, UserDocument } from '@/models/User'; 
import { connectDB } from '@/lib/mongodb';

export type CreateUserData = {
  name: string;
  email: string;
  password: string;
  role?: 'Admin' | 'User';
  companyName?: string;
  phoneNumber?: string;
  zipCode?: string;
  isActive?: boolean;
};

export const createUser = async (userData: CreateUserData): Promise<UserDocument> => {
  try {
    await connectDB();

    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = new User({
      ...userData,
      password: hashedPassword,
    });

    await newUser.save();
    return newUser;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Database error');
    }
    throw new Error('Unknown error occurred');
  }
};

type GetAllUsersFilter = {
  role?: 'Admin' | 'User' | string; 
  isActive?: boolean;
};

export const getAllUsersByRole = async (filterParams: GetAllUsersFilter = {}): Promise<UserDocument[]> => {
  try {
    const filter: Record<string, unknown> = {};

    if (filterParams.role) {
      filter.role = filterParams.role;
    }

    if (filterParams.isActive !== undefined) {
      filter.isActive = filterParams.isActive;
    }

    const users = await User.find(filter)
      .select('name email role isActive companyName phoneNumber zipCode createdAt updatedAt');

    return users;
  } catch (error: unknown) {
    console.log(error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Database error');
    }
    throw new Error('Unknown error occurred');
  }
};

export const getUserByID = async (userId: string, includePassword: boolean = false): Promise<UserDocument | null> => {
  try {
    await connectDB();

    const user = await User.findById(userId).select(includePassword ? '+password' : '-password');

    return user;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Database error');
    }
    throw new Error('Unknown error occurred');
  }
};

export type UpdateUserData = Partial<Omit<CreateUserData, 'password'>> & {
  password?: string;
};

export const updateUser = async (userId: string, updateData: UpdateUserData): Promise<UserDocument> => {
  try {
    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (updateData.password) {
      const hashedPassword = await bcrypt.hash(updateData.password, 10);
      updateData.password = hashedPassword;
    } else {
      delete updateData.password; 
    }

    Object.assign(user, updateData);

    await user.save();
    return user;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Database error');
    }
    throw new Error('Unknown error occurred');
  }
};
