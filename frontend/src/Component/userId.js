// Ensures every visitor (logged in or not) has a stable numeric ID
// stored in localStorage, so cart requests never send a null/undefined userId.
export const getOrCreateUserId = () => {
  let userId = localStorage.getItem('user_id');

  if (!userId || userId === 'null' || userId === 'undefined') {
    // Generate a random guest ID in a range that won't collide with real
    // auto-increment user IDs (assuming your real users stay well under 1,000,000).
    userId = String(1000000 + Math.floor(Math.random() * 9000000));
    localStorage.setItem('user_id', userId);
  }

  return Number(userId);
};