import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import { ArrowUpRight, Users, MessageSquare, Target, Shield } from 'lucide-react';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Your Perfect <span className="text-blue-600">Study Buddy</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with compatible study partners based on your classes, academic goals, and study preferences
          </p>
          <div className="flex gap-4 justify-center">
            <a href={user ? "/dashboard" : "/sign-up"} className="inline-flex items-center px-8 py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold shadow-lg">
              {user ? "Go to Dashboard" : "Get Started Free"}
              <ArrowUpRight className="ml-2 w-5 h-5" />
            </a>
            <a href="#features" className="inline-flex items-center px-8 py-4 text-blue-600 bg-white border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-lg font-semibold">
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Find study partners who match your academic profile and study style in three simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Create Your Profile</h3>
              <p className="text-gray-600">Add your major, classes, GPA, and study preferences to help us understand your needs</p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm">
              <div className="bg-purple-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Matched</h3>
              <p className="text-gray-600">Our algorithm finds compatible study partners based on shared classes and preferences</p>
            </div>

            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-teal-50 rounded-xl shadow-sm">
              <div className="bg-green-600 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Start Studying</h3>
              <p className="text-gray-600">Connect via chat and coordinate study sessions with your new study buddies</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Students Love Us</h2>
            <p className="text-blue-100 max-w-2xl mx-auto">Join thousands of students who have improved their grades through collaborative studying</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Target className="w-8 h-8" />, title: "Smart Matching", description: "AI-powered algorithm finds your ideal study partners" },
              { icon: <Users className="w-8 h-8" />, title: "Verified Students", description: "University email verification ensures authentic connections" },
              { icon: <MessageSquare className="w-8 h-8" />, title: "Real-time Chat", description: "Instant messaging to coordinate study sessions" },
              { icon: <Shield className="w-8 h-8" />, title: "Safe & Secure", description: "Your data is protected with enterprise-grade security" }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-blue-100">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-gray-600">Active Students</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-blue-600 mb-2">50K+</div>
              <div className="text-gray-600">Study Sessions</div>
            </div>
            <div>
              <div className="text-5xl font-bold text-blue-600 mb-2">95%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Find Your Study Buddy?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg">Join thousands of students who are achieving better grades through collaborative learning</p>
          <a href={user ? "/dashboard" : "/sign-up"} className="inline-flex items-center px-8 py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold shadow-lg">
            {user ? "Go to Dashboard" : "Sign Up Now - It's Free"}
            <ArrowUpRight className="ml-2 w-5 h-5" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}