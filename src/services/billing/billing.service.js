const { User } = require('../../models/User');
const { createCustomerVault } = require('../nmi/nmi.service');
const { ErrorHandler } = require('../../utils/error-handler');

const saveCard = async (cardData) => {
  const { user_id, card_number, expiry_month, expiry_year, cvv, billing_address, zip, full_name } = cardData;

  const payload = {
    first_name: full_name,
    card_number,
    expiration_date: `${expiry_month}${expiry_year}`,
    cvv,
    address1: billing_address || '',
    zip,
  };

  let vaultResponse;

  try {
    vaultResponse = await createCustomerVault(payload);
  } catch (err) {
    console.error('NMI vault creation error:', err.message);
    throw new ErrorHandler(500, 'Failed to save card to payment gateway');
  }
  console.log('NMI vault response:', vaultResponse);
  const responseText = vaultResponse.data;

  const vaultIdMatch = responseText.match(/customer_vault_id=(\d+)/);
  const vaultId = vaultIdMatch ? vaultIdMatch[1] : null;

  if (!vaultId) {
    throw new ErrorHandler(500, 'Failed to retrieve customer vault ID from gateway');
  }

  const user = await User.findById(user_id);
  if (!user) throw new ErrorHandler(404, 'User not found');

  user.customerVaultId = vaultId;
  await user.save();

  return {
    customerVaultId: vaultId,
    userId: user._id,
  };
};

module.exports = {
  saveCard,
};
