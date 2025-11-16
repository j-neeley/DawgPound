import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardBody } from '../components/common/Card';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { groupService } from '../services/group.service';
import { discoveryService } from '../services/discovery.service';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  const { data: recommendedGroups, isLoading: loadingGroups } = useQuery({
    queryKey: ['recommendedGroups'],
    queryFn: groupService.getRecommendations,
  });

  const { data: discoveryFeed, isLoading: loadingFeed } = useQuery({
    queryKey: ['discoveryFeed'],
    queryFn: discoveryService.getDiscoveryFeed,
  });

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-900 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.name}! 🐾
        </h1>
        <p className="text-blue-100">
          Explore groups, connect with friends, and engage with your community.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/groups">
          <Card hoverable className="h-full">
            <CardBody className="flex flex-col items-center text-center py-6">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full mb-4">
                <svg
                  className="h-8 w-8 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Browse Groups
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Join public groups and forums
              </p>
            </CardBody>
          </Card>
        </Link>

        <Link to="/messages">
          <Card hoverable className="h-full">
            <CardBody className="flex flex-col items-center text-center py-6">
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4">
                <svg
                  className="h-8 w-8 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Messages
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chat with friends
              </p>
            </CardBody>
          </Card>
        </Link>

        <Link to="/discover">
          <Card hoverable className="h-full">
            <CardBody className="flex flex-col items-center text-center py-6">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-full mb-4">
                <svg
                  className="h-8 w-8 text-purple-600 dark:text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Discover
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Find people and groups
              </p>
            </CardBody>
          </Card>
        </Link>
      </div>

      {/* Recommended Groups */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Recommended Groups
          </h2>
          <Link
            to="/groups"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all
          </Link>
        </div>

        {loadingGroups ? (
          <LoadingSpinner />
        ) : recommendedGroups && recommendedGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedGroups.slice(0, 6).map((rec: any) => (
              <Link key={rec.group.id} to={`/groups/${rec.group.id}`}>
                <Card hoverable>
                  <CardBody>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {rec.group.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {rec.group.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {rec.group.memberCount || rec.group.members?.length || 0} members
                      </span>
                      {rec.reasons && rec.reasons.length > 0 && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                          {rec.reasons[0]}
                        </span>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                No group recommendations available. Try completing your profile or joining some groups!
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Discovery Feed */}
      {discoveryFeed && (discoveryFeed.users?.length > 0 || discoveryFeed.groups?.length > 0) && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            People You May Know
          </h2>
          {loadingFeed ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {discoveryFeed.users?.slice(0, 6).map((rec: any) => (
                <Card key={rec.user.id}>
                  <CardBody>
                    <div className="flex items-start space-x-3">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-3">
                        <svg
                          className="h-6 w-6 text-gray-600 dark:text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {rec.user.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {rec.user.majors?.[0]}
                        </p>
                        {rec.reasons && rec.reasons.length > 0 && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {rec.reasons[0]}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
