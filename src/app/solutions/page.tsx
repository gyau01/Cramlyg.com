import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Users, Target, MessageSquare, Clock, BookOpen, CheckCircle, Sparkles, TrendingUp, Zap, ArrowRight, Star, Heart } from "lucide-react";

export default function SolutionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900 to-indigo-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">Smart Matching Technology</span>
          </div>
          <h1 className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Find Your Perfect<br />
            <span className="bg-gradient-to-r from-cyan-300 to-blue-200 bg-clip-text text-transparent">
              Study Match
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto font-light">
            Connect with students who share your classes, goals, and study style. 
            <span className="font-semibold text-white"> Build powerful study groups and ace your exams together.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/sign-up"
              className="group relative px-8 py-4 bg-white text-blue-600 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl hover:shadow-2xl"
            >
              Get Started Free
              <ArrowRight className="inline-block ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/dashboard"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-full font-semibold text-lg hover:bg-white/20 transition-all"
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Smart Matching That <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">Actually Works</span>
            </h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Our intelligent algorithm matches you with study partners who truly complement your learning style
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 border border-blue-600/50 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Class-Based Matching</h3>
                <p className="text-blue-100 leading-relaxed">
                  Find study partners taking the same classes. Whether you're looking for someone in your 
                  specific course or similar subjects, we connect you with the right students.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 border border-blue-600/50 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  <Clock className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Study Time Preferences</h3>
                <p className="text-blue-100 leading-relaxed">
                  Match with students who prefer the same study times. Early bird or night owl, 
                  morning sessions or evening study groups - find your perfect schedule match.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 border border-blue-600/50 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Study Style Compatibility</h3>
                <p className="text-blue-100 leading-relaxed">
                  Connect with students who share your study approach. Whether you prefer visual learning, 
                  discussion-based study, or quiet focused sessions, find your ideal match.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 border border-blue-600/50 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Group Size Preferences</h3>
                <p className="text-blue-100 leading-relaxed">
                  Join study groups that match your preferred size. Whether you thrive in one-on-one sessions, 
                  small groups, or larger study circles, we find the right fit for you.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 border border-blue-600/50 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-indigo-500 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Study Location Matching</h3>
                <p className="text-blue-100 leading-relaxed">
                  Find study partners who prefer the same locations. Library, coffee shop, campus, or online - 
                  connect with students who study where you do.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 border border-blue-600/50 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  <CheckCircle className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Academic Goals Alignment</h3>
                <p className="text-blue-100 leading-relaxed">
                  Match with students who share your academic aspirations. Whether you're aiming for top grades, 
                  understanding concepts deeply, or preparing for exams, find like-minded study partners.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Group Studying Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
                <Heart className="h-4 w-4 text-white" />
                <span className="text-sm font-medium">Why Students Love Group Studying</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
                Study Smarter, Not Harder
              </h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Research shows students in study groups perform 15% better on exams
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Zap className="h-6 w-6 text-cyan-300" />
                  </div>
                  <h3 className="text-2xl font-bold">Supercharged Learning</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-50">Better understanding through discussion and explanation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-50">Different perspectives on complex topics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-50">Improved motivation and accountability</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-50">Shared resources and study materials</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-50">Preparation for group projects and presentations</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-cyan-300" />
                  </div>
                  <h3 className="text-2xl font-bold">How It Works</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Create Your Profile</h4>
                      <p className="text-blue-100 text-sm">Add your classes, study preferences, and academic goals in minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Get Matched Instantly</h4>
                      <p className="text-blue-100 text-sm">Our algorithm finds compatible study partners based on your preferences</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 text-white rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0 shadow-lg">
                      3
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">Connect & Study</h4>
                      <p className="text-blue-100 text-sm">Message your matches and organize study sessions together</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              Ready to Find Your Perfect <span className="bg-gradient-to-r from-blue-300 to-cyan-300 bg-clip-text text-transparent">Study Match?</span>
            </h2>
            <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
              Stop studying alone. Connect with students who share your goals and study style. 
              Join thousands of students who are already acing their classes together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/sign-up"
                className="group relative px-10 py-5 bg-white text-blue-600 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl hover:shadow-2xl"
              >
                Get Started Free
                <ArrowRight className="inline-block ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="/pricing"
                className="px-10 py-5 bg-blue-500/20 text-white border-2 border-blue-400/50 rounded-full font-semibold text-lg hover:bg-blue-500/30 hover:border-blue-400 transition-all"
              >
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
