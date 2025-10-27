const { wrapAsync } = require('../utils/wrap-async');
const UserService = require('../services/user.service');
const { sendResponse } = require('../utils/response');

const getAll = wrapAsync(async (req, res) => {
  const data = await UserService.listUsers();
  sendResponse(res, { data }, 'OK');
});

const getOne = wrapAsync(async (req, res) => {
  const user = await UserService.getUserById(req.params.id);
  sendResponse(res, { user }, 'OK');
});

const update = wrapAsync(async (req, res) => {
  const user = await UserService.updateUser(req.params.id, req.body);
  sendResponse(res, { user }, 'Updated');
});

const remove = wrapAsync(async (req, res) => {
  await UserService.deleteUser(req.params.id);
  sendResponse(res, {}, 'Deleted');
});

module.exports = { getAll, getOne, update, remove };
