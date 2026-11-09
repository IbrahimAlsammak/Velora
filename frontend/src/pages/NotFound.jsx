import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="py-24 text-center">
      <h1 className="font-display text-4xl">Page not found</h1>
      <Link to="/" className="mt-6 inline-block text-gold underline">Back to home</Link>
    </section>
  )
}
