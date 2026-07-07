// Redirects to sign-in unless the logged-in user has the required role.
export default function requireRole(role) {
  return (req, res, next) => {
    if (req.session.user && req.session.user.role === role) {
      return next();
    }
    return res.redirect("/");
  };
}
