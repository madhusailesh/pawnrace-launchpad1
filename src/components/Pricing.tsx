import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, Crown, Star } from 'lucide-react';
import Navbar from './Navbar';

interface PricingProps {
  onLoginClick: () => void;
}

const Pricing: React.FC<PricingProps> = ({ onLoginClick }) => {
  const plans = [
    {
      name: 'Beginner',
      price: '₹999',
      period: '/month',
      description: 'Perfect for chess newcomers',
      features: [
        '4 one-on-one sessions per month',
        'Basic game analysis',
        'Access to beginner curriculum',
        'Email support',
        'Progress tracking'
      ],
      popular: false,
      cta: 'buy now'
    },
    {
      name: 'Intermediate',
      price: '₹1,9999',
      period: '/month',
      description: 'For developing competitive players',
      features: [
        '8 one-on-one sessions per month',
        'Advanced game analysis',
        'Complete chess curriculum',
        'Priority support',
        'Tournament preparation',
        'Custom practice assignments',
        'Coach feedback reports'
      ],
      popular: false,
      cta: 'buy now'
    },
    {
      name: 'Pro',
      price: '₹3,9999',
      period: '/month',
      description: 'Elite training for serious players',
      features: [
        'Unlimited one-on-one sessions',
        'GM-level coaching',
        'Personalized curriculum',
        '24/7 premium support',
        'Master-level game analysis',
        'Opening repertoire building',
        'Psychology & mindset coaching',
        'Tournament strategy sessions'
      ],
      popular: false,
      cta: 'buy now'
    }
  ];

  return (
    <>
      <Navbar />
      <section id="pricing" className="py-20 bg-blue-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 bg-blue-700">
          {/* Heading */}
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-yellow-500">
              Choose Your <span className="text-yellow-600">Chess Journey</span>
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Flexible pricing plans designed to fit every chess player's needs and budget
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative bg-white rounded-2xl shadow-lg border border-yellow-400 hover:shadow-2xl transition-transform transform hover:scale-105 p-8 mt-12`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-yellow-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center space-x-1 shadow-lg">
                      <Star className="h-4 w-4 fill-current" />
                      <span>Most Popular</span>
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-yellow-600 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-yellow-500">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <Check className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Button
                  onClick={onLoginClick}
                  className={`w-full py-3 rounded-xl font-semibold text-lg ${
                    plan.popular
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white'
                  }`}
                  size="lg"
                >
                  {plan.popular && <Crown className="mr-2 h-5 w-5" />}
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>

          {/* Money-back Guarantee */}
          <div className="text-center mt-16">
            <div className="inline-flex items-center space-x-2 text-gray-600">
              <Check className="h-5 w-5 text-yellow-500" />
              <span>30-day money-back guarantee on all plans</span>
            </div>
          </div>

          {/* Enterprise CTA */}
          <div className="mt-16 text-center bg-yellow-50 rounded-2xl p-8 shadow-md">
            <h3 className="text-2xl font-bold mb-3 text-yellow-600">
              Need a custom plan for your chess club or school?
            </h3>
            <p className="text-gray-700 mb-6">
              We offer enterprise solutions with volume discounts and additional features
            </p>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-white"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Pricing;
