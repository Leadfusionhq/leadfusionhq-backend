const express = require('express');
const userRouter = express.Router();
const UserController = require('../controllers/user-controllers');

const API = {
    GET_ALL_USERS: '/',
};

userRouter.get(
    API.GET_ALL_USERS,
    UserController.getAllUsers
);

module.exports = userRouter;
