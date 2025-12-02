function formatFullAddress(address = {}) {
  const composedAddressParts = [
    address?.street,
    address?.city,
    address?.state?.name || address?.state,
    address?.zip_code
  ].filter(Boolean);

  const composedAddress = composedAddressParts.join(', ');

  return address?.full_address || composedAddress || 'N/A';
}

function makeAddressLink(fullAddress) {
  if (!fullAddress || fullAddress === 'N/A') return 'N/A';

  return `
    <a href="https://maps.google.com/?q=${encodeURIComponent(fullAddress)}"
       target="_blank"
       rel="noopener noreferrer"
       style="color:#000; text-decoration:none;">
       ${fullAddress}
    </a>
  `;
}

module.exports = { formatFullAddress, makeAddressLink };
