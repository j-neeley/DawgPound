"""
Mock taxonomy data for majors and interests/hobbies.
"""

MAJORS = [
    "Computer Science",
    "Engineering",
    "Business Administration",
    "Psychology",
    "Biology",
    "Economics",
    "Mathematics",
    "English Literature",
    "Political Science",
    "Chemistry",
    "Physics",
    "History",
    "Sociology",
    "Art",
    "Music",
    "Communications",
    "Education",
    "Nursing",
    "Philosophy",
    "Environmental Science"
]

INTERESTS_HOBBIES = [
    "Gaming",
    "Sports",
    "Reading",
    "Music",
    "Art",
    "Photography",
    "Cooking",
    "Travel",
    "Fitness",
    "Yoga",
    "Meditation",
    "Hiking",
    "Camping",
    "Swimming",
    "Dancing",
    "Singing",
    "Writing",
    "Blogging",
    "Podcasting",
    "Volunteering",
    "Coding",
    "Web Development",
    "Mobile Apps",
    "AI/ML",
    "Data Science",
    "Robotics",
    "3D Printing",
    "Electronics",
    "DIY Projects",
    "Gardening",
    "Sustainability",
    "Fashion",
    "Makeup",
    "Skincare",
    "Film",
    "TV Shows",
    "Anime",
    "Comics",
    "Board Games",
    "Card Games",
    "Chess",
    "Entrepreneurship",
    "Investing",
    "Cryptocurrency",
    "Languages",
    "Culture",
    "Politics",
    "Social Justice"
]

def get_taxonomy():
    """Return mock taxonomy data."""
    return {
        "majors": MAJORS,
        "interests": INTERESTS_HOBBIES
    }
