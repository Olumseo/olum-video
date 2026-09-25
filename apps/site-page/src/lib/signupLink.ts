/**
 * localStorage key for the sign-up an emailed link belongs to.
 *
 * Firebase requires the email address again when a sign-in link is opened.
 * The tab that sent the link stores {id, email} here, so a link opened in the
 * same browser completes without asking; on another device the visitor is
 * asked to type their email once.
 */
export const LINK_KEY = "olum.signup.email-link";
