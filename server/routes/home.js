import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get home page statistics
router.get('/stats', async (req, res) => {
  try {
    // Get volunteer count
    const volunteerCount = await prisma.userProfile.count();
    
    // Get upcoming events count
    const upcomingEvents = await prisma.eventDetails.count({
      where: {
        eventDate: {
          gte: new Date()
        }
      }
    });
    
    // Get total volunteer hours
    const volunteerHours = await prisma.volunteerHistory.aggregate({
      _sum: {
        hoursVolunteered: true
      }
    });
    
    // Get events completed today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const completedToday = await prisma.volunteerHistory.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lt: endOfDay
        },
        participationStatus: 'completed'
      }
    });

    res.json({
      success: true,
      data: {
        volunteerCount,
        upcomingEvents,
        totalHours: volunteerHours._sum.hoursVolunteered || 0,
        completedToday
      }
    });
  } catch (error) {
    console.error('Error fetching home stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

// Get featured events for home page
router.get('/featured-events', async (req, res) => {
  try {
    const featuredEvents = await prisma.eventDetails.findMany({
      where: {
        eventDate: {
          gte: new Date()
        }
      },
      orderBy: {
        eventDate: 'asc'
      },
      take: 4, // Get next 4 upcoming events
      include: {
        _count: {
          select: {
            volunteerHistory: {
              where: {
                participationStatus: {
                  in: ['registered', 'confirmed']
                }
              }
            }
          }
        }
      }
    });

    const formattedEvents = featuredEvents.map(event => ({
      id: event.id,
      title: event.eventName,
      description: event.description,
      location: event.location,
      date: event.eventDate,
      urgency: event.urgency,
      requiredSkills: event.requiredSkills,
      signedUpCount: event._count.volunteerHistory,
      createdAt: event.createdAt
    }));

    res.json({
      success: true,
      data: formattedEvents
    });
  } catch (error) {
    console.error('Error fetching featured events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured events'
    });
  }
});

export default router;