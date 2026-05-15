import React from 'react';

export const LegalPage = () => {
  return (
    <div className="max-w-2xl mx-auto py-12 px-6 text-on-surface font-body space-y-8">
      <h1 className="font-headline text-4xl font-bold">Terms of Service & Disclaimer</h1>
      
      <section className="space-y-4">
        <h2 className="font-headline text-2xl font-semibold">General Information</h2>
        <p className="text-on-surface-variant leading-relaxed">
          Sanctuary is an AI-powered spiritual and personal growth tool. 
          Content is provided for informational and educational purposes only.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-headline text-2xl font-semibold">No Professional Advice</h2>
        <p className="text-on-surface-variant leading-relaxed">
          Interactions with this platform do not constitute medical, psychological, 
          legal, or financial advice. Users should consult licensed professionals for such matters.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-headline text-2xl font-semibold">Limitation of Liability</h2>
        <p className="text-on-surface-variant leading-relaxed">
          To the maximum extent permitted by law, Aditi Nirvaan and Sanctuary shall not be liable 
          for any direct, indirect, or incidental damages arising from the use or inability to use 
          the service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-headline text-2xl font-semibold">User Accountability</h2>
        <p className="text-on-surface-variant leading-relaxed">
          Users acknowledge that they use the platform at their own discretion and risk.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="font-headline text-2xl font-semibold">Right to Terminate</h2>
        <p className="text-on-surface-variant leading-relaxed">
          Management reserves the right to restrict access to any user who violates 
          community standards.
        </p>
      </section>
    </div>
  );
};
