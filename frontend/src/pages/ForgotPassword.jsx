import { Link } from 'react-router-dom'
import AuthCard from '../components/AuthCard.jsx'
import { STORE } from '../config/store.js'
import { callUrl, whatsappUrl } from '../utils/phone.js'

/**
 * "Forgot password?" - the customer messages the store, and the admin
 * sets a new password for them in Admin -> Customers.
 */
export default function ForgotPassword() {
  const message = encodeURIComponent('Hello Velora, I forgot my password. My account phone number is: ')

  return (
    <AuthCard title="Forgot your password?"
      subtitle="No problem - message us and we'll set a new password for you.">
      {STORE.whatsapp ? (
        <a href={`${whatsappUrl(STORE.whatsapp)}?text=${message}`} target="_blank" rel="noreferrer"
          className="block rounded-full bg-mulberry py-3.5 text-center text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold">
          Message us on WhatsApp
        </a>
      ) : STORE.phone ? (
        <a href={callUrl(STORE.phone)}
          className="block rounded-full bg-mulberry py-3.5 text-center text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold">
          Call us: {STORE.phone}
        </a>
      ) : (
        <Link to="/contact"
          className="block rounded-full bg-mulberry py-3.5 text-center text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold">
          Contact us
        </Link>
      )}
      <p className="mt-4 text-center text-sm text-mulberry/60">
        Please send us the phone number you use to log in.
      </p>
      <Link to="/login" className="mt-6 block text-center text-sm text-gold underline">Back to log in</Link>
    </AuthCard>
  )
}
