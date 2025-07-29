import mongoose, { Document, Schema, models, model } from 'mongoose';

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: 'Admin' | 'User';
  companyName?: string;
  phoneNumber?: string;
  zipCode?: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  verificationToken:string;
}

export interface UserModel extends mongoose.Model<UserDocument> {
  findByEmail(email: string): Promise<UserDocument | null>;
}

const userSchema = new Schema<UserDocument, UserModel>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'User'], default: 'User' },
    companyName: { type: String, required: false },
    phoneNumber: { type: String, required: false },
    zipCode: { type: String, required: false },
    isActive: { type: Boolean, default: true },
    isSuperAdmin: { type: Boolean, default: false },
    verificationToken: { type: String, required: false },
  },
  { timestamps: true }
);

// Implement static method
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email });
};

export const User = models.User || model<UserDocument, UserModel>('User', userSchema);
