import { Rocket, Shield, TrendingUp } from 'lucide-react'

import { StudentSignInButton } from '~/components/auth/student-sign-in-button'
import { BrandLogo } from '~/components/brand/brand-logo'
import { cn } from '~/lib/class-name-merge'

import { PawketBrutalButton } from './pawket-brutal-button'
import { PawketBrutalFrame } from './pawket-brutal-frame'
import { PawketIconTile } from './pawket-icon-tile'

export function PawketLandingPage(props: { returnTo?: string }) {
  return (
    <div className="bg-background text-foreground min-h-dvh min-w-0">
      <LandingHeader returnTo={props.returnTo} />

      <main className="grid w-full min-w-0 grid-cols-[1rem_minmax(0,1fr)_1rem] gap-y-16 py-10 pt-24 md:mx-auto md:flex md:max-w-[1200px] md:flex-col md:gap-20 md:px-12 md:pt-28">
        <LandingHero />

        <LandingFeatures />

        <LandingCta />
      </main>

      <LandingFooter />
    </div>
  )
}

function LandingHeader(props: { returnTo?: string }) {
  return (
    <header className="bg-background border-ink shadow-brutal fixed top-0 z-50 w-full border-b-2">
      <div className="flex w-full items-center justify-between px-4 py-3 md:px-12">
        <BrandLogo brand="pawket" className="h-11 md:h-12" />

        <StudentSignInButton app="pawket" returnTo={props.returnTo}>
          Sign In Now
        </StudentSignInButton>
      </div>
    </header>
  )
}

function LandingHero() {
  return (
    <section className="gap-y-10 max-md:col-span-3 max-md:grid max-md:grid-cols-subgrid md:flex md:flex-row md:items-center md:gap-12">
      <div className="flex min-w-0 flex-col gap-6 max-md:col-start-2 md:flex-1">
        <span className="bg-secondary text-secondary-foreground border-ink inline-block rounded-full border-2 px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_var(--ink)]">
          FOR THE NEXT GEN
        </span>

        <h2 className="font-heading text-primary text-4xl leading-tight font-extrabold tracking-tight md:text-5xl">
          Master Your Money Like a Pro.
        </h2>

        <p className="text-muted-foreground max-w-lg text-lg leading-relaxed">
          The fun, game-inspired way for students to save, spend, and learn the
          art of the exchange. No boring spreadsheets, just pure growth.
        </p>

        <div className="flex min-w-0 flex-col gap-4 pt-2 sm:flex-row sm:flex-wrap">
          <PawketBrutalButton variant="outline" className="bg-card">
            Ask your teacher for an invite
          </PawketBrutalButton>
        </div>
      </div>

      <div className="min-w-0 overflow-x-clip pl-4 max-md:col-span-3 max-md:col-start-1 md:w-full md:max-w-[500px] md:flex-1 md:overflow-visible md:pl-0">
        <div className="bg-accent border-ink relative w-[95%] rotate-2 rounded-xl border-4 p-4 shadow-[12px_12px_0_0_var(--ink)] md:w-full">
          <img
            src="/brand/pawket-hero.png"
            alt="PawKet Exchange app on a phone"
            className="border-ink h-auto w-full rounded-lg border-2"
          />

          <PawketBrutalFrame className="bg-secondary text-secondary-foreground absolute -top-6 -right-6 -rotate-6 p-2">
            <Rocket className="size-8" aria-hidden />
          </PawketBrutalFrame>
        </div>
      </div>
    </section>
  )
}

function LandingFeatures() {
  return (
    <section
      id="features"
      className="grid min-w-0 grid-cols-1 gap-6 max-md:col-start-2 md:grid-cols-3"
    >
      <PawketBrutalFrame className="bg-card flex min-w-0 flex-col items-center gap-6 rounded-xl p-6 md:col-span-2 md:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <PawketIconTile className="bg-secondary text-secondary-foreground">
            <TrendingUp className="size-6" aria-hidden />
          </PawketIconTile>

          <h3 className="font-heading text-xl font-bold">
            Smart Growth Tracking
          </h3>

          <p className="text-muted-foreground text-base leading-relaxed">
            Watch your allowance grow with real-time visual progress bars. Level
            up your financial skills as you hit your savings milestones.
          </p>
        </div>

        <div className="w-full min-w-0 flex-1 space-y-3">
          <div className="flex justify-between text-sm font-semibold">
            <span>Savings Goal: New Laptop</span>

            <span>75%</span>
          </div>

          <div className="bg-muted border-ink h-6 w-full overflow-hidden rounded-full border-2">
            <div className="bg-secondary border-ink h-full w-3/4 border-r-2" />
          </div>
        </div>
      </PawketBrutalFrame>

      <PawketBrutalFrame className="bg-primary text-primary-foreground flex flex-col gap-3 rounded-xl p-6">
        <PawketIconTile className="bg-card text-primary">
          <Shield className="size-6" aria-hidden />
        </PawketIconTile>

        <h3 className="font-heading text-xl font-bold">Ironclad Security</h3>

        <p className="text-base leading-relaxed opacity-90">
          Bank-grade encryption that keeps your pocket money safe and sound. We
          use the same tech as the grown-ups, but way cooler.
        </p>
      </PawketBrutalFrame>

      <PawketBrutalFrame
        large
        id="about"
        className="bg-accent text-accent-foreground relative overflow-hidden rounded-xl p-8 md:col-span-3"
      >
        <div className="relative z-10 max-w-2xl space-y-4">
          <h3 className="font-heading text-3xl font-extrabold">
            Not just a bank. An education.
          </h3>

          <p className="text-lg leading-relaxed">
            PawKet Exchange was built by students, for students. We believe
            financial literacy shouldn&apos;t be a chore. Through our gamified
            exchange system, you&apos;ll learn how to budget for your
            &apos;Wants&apos;, &apos;Needs&apos;, and &apos;Big Dreams&apos;
            without breaking a sweat.
          </p>

          <div className="flex flex-wrap gap-2">
            <FeatureTag label="#FinancialFreedom" />

            <FeatureTag label="#StudentPower" />

            <FeatureTag label="#ZeroFees" />
          </div>
        </div>
      </PawketBrutalFrame>
    </section>
  )
}

function FeatureTag(props: { label: string }) {
  return (
    <span className="bg-card text-foreground border-ink rounded-lg border-2 px-3 py-1 text-sm font-semibold shadow-[2px_2px_0_0_var(--ink)]">
      {props.label}
    </span>
  )
}

function LandingCta() {
  return (
    <PawketBrutalFrame
      large
      className="bg-muted min-w-0 space-y-6 rounded-xl border-4 p-8 text-center max-md:col-start-2"
    >
      <h2 className="font-heading text-primary text-3xl font-extrabold">
        Ready to level up your pocket?
      </h2>

      <p className="text-muted-foreground mx-auto max-w-xl text-lg leading-relaxed">
        Join 50,000+ students already mastering their exchange. Sign up today
        and get your first $5 &apos;Growth Bonus&apos;.
      </p>

      <div className="pt-2">
        <PawketBrutalButton
          large
          className="bg-secondary text-secondary-foreground"
        >
          Get Started Free
        </PawketBrutalButton>
      </div>
    </PawketBrutalFrame>
  )
}

function LandingFooter() {
  return (
    <footer className="border-primary bg-ink text-background mt-16 border-t-4 py-12">
      <div className="mx-auto max-w-[1200px] px-4 md:px-12">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-accent border-background size-8 rounded-full border-2" />

              <h4 className="font-heading text-accent text-xl font-bold tracking-wider uppercase">
                PawKet Exchange
              </h4>
            </div>

            <p className="text-primary-80 max-w-md text-lg leading-relaxed">
              Empowering the next generation of financial leaders through
              gamified learning and secure exchange solutions.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <FooterLinkGroup
              title="Legal"
              links={[
                { label: 'Privacy Policy', href: '#' },
                { label: 'Terms of Service', href: '#' },
              ]}
            />

            <FooterLinkGroup
              title="Support"
              links={[
                { label: 'Contact Us', href: '#' },
                { label: 'Safety Guide', href: '#' },
              ]}
            />

            <FooterLinkGroup
              title="Connect"
              className="col-span-2 sm:col-span-1"
              links={[]}
              social
            />
          </div>
        </div>

        <div className="border-background/30 mt-12 flex flex-col items-center justify-between gap-4 border-t-2 pt-6 md:flex-row">
          <p className="text-primary-80 text-xs">
            © 2024 PawKet Exchange. Built for students.
          </p>

          <p className="text-primary-80 text-xs">
            Designed with ♥ by Future Bankers
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterLinkGroup(props: {
  title: string
  links: Array<{ label: string; href: string }>
  className?: string
  social?: boolean
}) {
  return (
    <div className={cn('flex flex-col gap-2', props.className)}>
      <span className="text-primary-90 text-sm font-semibold tracking-tighter uppercase">
        {props.title}
      </span>

      {props.social ? (
        <div className="mt-1 flex gap-3">
          {(['FB', 'IG', 'TW'] as const).map(network => (
            <div
              key={network}
              className="border-background hover:bg-background hover:text-ink flex size-10 cursor-pointer items-center justify-center border-2 text-xs font-bold transition-colors"
            >
              {network}
            </div>
          ))}
        </div>
      ) : (
        props.links.map(link => (
          <a
            key={link.label}
            href={link.href}
            className="hover:text-secondary text-sm transition-colors"
          >
            {link.label}
          </a>
        ))
      )}
    </div>
  )
}
