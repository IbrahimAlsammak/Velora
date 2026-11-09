import { STORE } from '../config/store.js'

/** The Contact page. Every detail comes from config/store.js - empty ones are hidden. */
export default function Contact() {
  const digits = (s) => s.replace(/[^0-9]/g, '') // "+961 3 123 456" -> "9613123456"

  const ways = [
    STORE.whatsapp && {
      title: 'WhatsApp',
      text: 'Chat with us - the quickest way to reach us.',
      value: STORE.whatsapp,
      href: `https://wa.me/${digits(STORE.whatsapp)}`,
      button: 'Open WhatsApp',
    },
    STORE.phone && {
      title: 'Phone',
      text: 'Give us a call.',
      value: STORE.phone,
      href: `tel:${STORE.phone.replace(/\s/g, '')}`,
      button: 'Call us',
    },
    STORE.email && {
      title: 'Email',
      text: 'We usually reply within a day.',
      value: STORE.email,
      href: `mailto:${STORE.email}`,
      button: 'Send an email',
    },
    STORE.instagram && {
      title: 'Instagram',
      text: 'See our latest pieces and send us a message.',
      value: '@' + STORE.instagram.replace(/\/+$/, '').split('/').pop(),
      href: STORE.instagram,
      button: 'Visit Instagram',
    },
    STORE.tiktok && {
      title: 'TikTok',
      text: 'Styling videos and new arrivals.',
      value: STORE.tiktok.replace(/\/+$/, '').split('/').pop(),
      href: STORE.tiktok,
      button: 'Visit TikTok',
    },
    STORE.facebook && {
      title: 'Facebook',
      text: 'Follow us and send us a message.',
      value: 'Velora on Facebook',
      href: STORE.facebook,
      button: 'Visit Facebook',
    },
  ].filter(Boolean) // remove the empty ones

  return (
    <section className="mx-auto max-w-4xl px-4 py-16">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">We&apos;re here to help</p>
        <h1 className="mt-3 font-display text-5xl font-semibold">Get in touch</h1>
        <p className="mx-auto mt-4 max-w-lg text-mulberry/70">
          Questions about sizing, an order, or styling? Reach us any way you like.
        </p>
      </div>

      {ways.length === 0 ? (
        <p className="mt-12 text-center text-mulberry/60">Contact details coming soon.</p>
      ) : (
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {ways.map((w) => (
            <div key={w.title} className="flex flex-col rounded-2xl border border-gold-light bg-white/70 p-6">
              <div className="h-8 w-6 rounded-t-full border-2 border-gold" aria-hidden />
              <h2 className="mt-4 font-display text-2xl">{w.title}</h2>
              <p className="mt-1 text-sm text-mulberry/70">{w.text}</p>
              <p className="mt-3 break-all font-medium">{w.value}</p>
              <a href={w.href} target={w.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer"
                className="mt-5 self-start rounded-full bg-mulberry px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-cream transition hover:bg-gold">
                {w.button}
              </a>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
