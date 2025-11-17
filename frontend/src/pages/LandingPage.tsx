import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to DawgPound
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Connect with your university community, join groups, and engage in meaningful discussions.
          </p>
        </header>

        {/* Features Section */}
        <section className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Join Groups
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Connect with students who share your interests and passions.
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Forum Discussions
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Participate in engaging conversations and share your knowledge.
            </p>
          </div>

          <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Real-time Chat
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Stay connected with instant messaging and live updates.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to get started?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Join your university community today with your .edu email address.
            </p>
            <div className="space-y-3">
              <Link to="/signup" className="block">
                <Button variant="primary" className="w-full">
                  Sign Up
                </Button>
              </Link>
              <Link to="/login" className="block">
                <Button variant="secondary" className="w-full">
                  Log In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            © 2025 DawgPound. For university students only.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
