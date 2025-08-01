import mongoose, { Document, Schema, models, model } from 'mongoose';

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'USER';
  companyName?: string;
  phoneNumber?: string;
  zipCode?: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  verificationToken:string;
  verificationTokenExpires:Date;
  isEmailVerified: boolean;
  resetPasswordToken:string;
  resetPasswordExpires:Date;


}

export interface UserModel extends mongoose.Model<UserDocument> {
  findByEmail(email: string): Promise<UserDocument | null>;
}

const userSchema = new Schema<UserDocument, UserModel>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'USER'], default: 'USER' },
    companyName: { type: String, required: false },
    phoneNumber: { type: String, required: false },
    zipCode: { type: String, required: false },
    isActive: { type: Boolean, default: true }, // Can admin disable account?
    isEmailVerified: { type: Boolean, default: false }, // Email confirmed?

    isSuperAdmin: { type: Boolean, default: false },
    verificationToken: { type: String, required: false },
    verificationTokenExpires: { 
      type: Date, 
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    resetPasswordToken: { type: String, required: false },
    resetPasswordExpires: { 
      type: Date, 
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
    },

  },
  { timestamps: true }
);

// Implement static method
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email });
};

export const User = models.User || model<UserDocument, UserModel>('USER', userSchema);
