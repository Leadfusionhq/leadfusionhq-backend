const express = require('express');
const userRouter = express.Router();
const AdminController = require('../controllers/admin.controllers');
const checkAuth = require('../middleware/check-auth');
const authorizedRoles = require('../middleware/authorized-roles.js');
const CONSTANT_ENUM = require('../helper/constant-enums.js');
const AdminSchema = require('../request-schemas/admin.schema.js');
const { celebrate } = require('celebrate');
const createUpload = require("../middleware/upload");

const API = {
    GET_ALL_ADMINS: '/',
    ADD_ADMIN: '/',
    UPDATE_ADMIN: '/:adminId',
    GET_ADMIN_BY_ID: '/:adminId',
    DELETE_ADMIN_BY_ID: '/:adminId',
    UPLOAD_AVATAR: "/:adminId/avatar",
    ADD_BALANCE: "/:userId/addBalance",
};


// Apply auth and role middleware to all admin routes
userRouter.use(
    checkAuth,
    // authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN],[CONSTANT_ENUM.USER_ROLE.ADMIN])
    authorizedRoles([CONSTANT_ENUM.USER_ROLE.ADMIN]),
);

// GET all admins
userRouter.get(API.GET_ALL_ADMINS, AdminController.getAllAdmins);

userRouter.post(API.ADD_ADMIN, celebrate(AdminSchema.createAdminByAdmin), AdminController.addAdmin);

userRouter.post(API.ADD_BALANCE, celebrate(AdminSchema.userBalanceByAdmin), AdminController.addUserBalance);

userRouter.get(API.GET_ADMIN_BY_ID, AdminController.getAdminById);

userRouter.put(API.UPDATE_ADMIN, AdminController.updateAdmin);

userRouter.delete(API.DELETE_ADMIN_BY_ID, AdminController.deleteAdmin);

const uploadAdmin = createUpload("profile/admin");
userRouter.patch(API.UPLOAD_AVATAR, uploadAdmin.single("avatar"), AdminController.uploadAvatarAdmin);


module.exports = userRouter;
