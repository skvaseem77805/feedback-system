'use client';

// Type definitions for the collaboration platform
export type AcademicYear = '1st' | '2nd' | '3rd' | 'final';

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  academicYear: AcademicYear;
  avatar?: string;
  bio?: string;
  skills?: string[];
  joinedAt: Date;
  uploadedProjects: string[];
  savedProjects: string[];
  likedProjects: string[];
  connections: string[];
  collaborations: string[];
}

export interface Project {
  id: string;
  studentId: string;
  studentName: string;
  academicYear: AcademicYear;
  title: string;
  description: string;
  category: string;
  uploadedAt: Date;
  likes: number;
  savedBy: string[];
  collaborators: string[];
  thumbnailUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface ConnectionRequest {
  id: string;
  fromStudentId: string;
  fromName: string;
  toStudentId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface Collaboration {
  id: string;
  projectId: string;
  studentIds: string[];
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

// Working code examples
const codeExamples: Record<string, string> = {
  reactComponent: `// React Component with Hooks
import React, { useState } from 'react';

export function ProjectCard({ project }) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <h3 className="font-bold">{project.title}</h3>
      <p className="text-sm text-gray-600">{project.description}</p>
      <button 
        onClick={() => setIsLiked(!isLiked)}
        className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
      >
        {isLiked ? '❤️ Liked' : '🤍 Like'}
      </button>
    </div>
  );
}`,

  pythonBackend: `# Flask API for Projects
from flask import Flask, jsonify, request
from datetime import datetime

app = Flask(__name__)

projects = []

@app.route('/api/projects', methods=['GET'])
def get_projects():
    return jsonify(projects)

@app.route('/api/projects/<id>/like', methods=['POST'])
def like_project(id):
    project = next((p for p in projects if p['id'] == id), None)
    if project:
        project['likes'] += 1
        return jsonify(project)
    return jsonify({'error': 'Not found'}), 404

if __name__ == '__main__':
    app.run(debug=True)`,

  databaseQuery: `-- Get Popular Projects with Collaborators
SELECT 
  p.id,
  p.title,
  s.name,
  COUNT(DISTINCT l.student_id) as like_count,
  COUNT(DISTINCT c.student_id) as collaborator_count
FROM projects p
JOIN students s ON p.student_id = s.id
LEFT JOIN likes l ON p.id = l.project_id
LEFT JOIN collaborators c ON p.id = c.project_id
GROUP BY p.id, p.title, s.name
ORDER BY like_count DESC;`,

  nextJSApi: `// Next.js API Route
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Process collaboration join
    const collaboration = {
      id: Date.now().toString(),
      ...data,
      joinedAt: new Date(),
    };
    
    return Response.json(collaboration, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}`,

  typeScriptTypes: `// TypeScript Type Definitions
interface Project {
  id: string;
  title: string;
  description: string;
  studentId: string;
  likes: number;
  collaborators: Collaborator[];
  status: 'draft' | 'published' | 'archived';
}

interface Collaborator {
  studentId: string;
  name: string;
  role: 'owner' | 'contributor' | 'viewer';
  joinedAt: Date;
}`,
};

// AI Responses with Code Examples
const mockAIResponses: Record<AcademicYear, Record<string, string>> = {
  '1st': {
    code: `Great question! Here's a beginner-friendly React component:\n\n${codeExamples.reactComponent}\n\nKey points:\n- useState manages component state\n- onClick handles click events\n- Try adding more buttons to practice!`,
    
    debug: `Common beginner errors:\n1. Forgetting to import components\n2. Missing return statements\n3. State updates not triggering re-renders\n\nUse console.log() to debug - it's your friend!`,
    
    project: `Great 1st year project ideas:\n- Calculator App with advanced functions\n- To-Do List with database persistence\n- Weather App using public APIs\n- Text-to-Image Generator (using Hugging Face API)\n- Simple Chat Application with real-time messaging\n- Personal Portfolio Website\n- Expense Tracker with analytics\n- Movie Recommendation System\n\nStart simple, then add features gradually!`,
    
    collaborate: `To join a collaboration:\n1. Click "Join Project"\n2. Add your skills\n3. Start contributing code\n\nCommunicate with your team through comments!`,
  },
  
  '2nd': {
    code: `Here's a production-ready Flask backend:\n\n${codeExamples.pythonBackend}\n\nBest practices:\n- Use proper HTTP methods\n- Add error handling\n- Structure your routes logically`,
    
    debug: `Advanced debugging:\n- Use debugger breakpoints\n- Check network requests in DevTools\n- Monitor API responses\n\nUse logging for production issues!`,
    
    project: `Intermediate project ideas (from IEEE Projects 2025-26):\n- Wood Surface Defect Detection (YOLOv9/v11): Detect defects in wood surfaces with Flask web interface\n- Fake News Detection with Explainable AI: XLNet, FastText, CNN with SHAP for transparency\n- Acne Detection System (YOLOv9): Classify 15 types of acne for dermatologists\n- Helmet Recognition System (YOLOv8): Real-time helmet detection for workplace safety\n- Forest Wildfire Detection (YOLOv9): Early detection using satellite/drone imagery\n- Caprine Parasite Classification (YOLOv12): Detect 11 types of parasitic eggs\n- Lumbar Abnormalities Detection (Faster R-CNN, YOLO, U-Net): MRI spine analysis\n- Iris-Based Disease Diagnosis (CNN, MobileNet, DenseNet): Detect glaucoma, diabetic retinopathy\n\nFocus on computer vision or AI integration!`,
    
    collaborate: `Collaborating effectively:\n- Define roles and responsibilities\n- Use version control (Git)\n- Write clean, documented code\n- Regular team meetings`,
  },
  
  '3rd': {
    code: `Production-grade TypeScript:\n\n${codeExamples.typeScriptTypes}\n\nFollow SOLID principles:\n- Single responsibility\n- Open/closed principle\n- Interface segregation`,
    
    debug: `Enterprise debugging:\n- Implement structured logging\n- Use APM tools (New Relic, Datadog)\n- Performance profiling\n- Load testing`,
    
    project: `Advanced project ideas (from IEEE Projects 2025-26):\n- Network Intrusion Detection (Seq2Seq + ConvLSTM + CNN + LSTM + FNN + XAI): Real-time cyber threat detection\n- Brain Tumor Segmentation (U-Net++, CNN, MobileNet): Automated tumor detection in MRI scans\n- Deepfake Audio Detection (MobileNetV2, DenseNet121, EfficientNetB0): Spectrogram-based deepfake detection\n- Plant Disease Detection (Hybrid DL + XGBoost): Leaf disease classification with CNN feature extraction\n- Polyp Segmentation in Colonoscopy (Attention U-Net, Swin-CNN, ViT-U-Net with Grad-CAM): Explainable AI for polyp detection\n- Thermal Image Metal Classification (CNN, MobileNet+LSTM, ResNet+Transformer): Flask web interface for metal identification\n- Durian Plant Disease Detection (DenseNet, ResNet, YOLO): Leaf and fruit disease classification\n- Text-to-Image Generator (Hugging Face models): Convert text descriptions to images\n\nFocus on medical imaging, agriculture, or security!`,
    
    collaborate: `Leading collaboration:\n- Code reviews for quality\n- Mentoring junior members\n- System design documentation\n- Performance optimization`,
  },
  
  final: {
    code: `Enterprise solution:\n\n${codeExamples.nextJSApi}\n\nProduction features:\n- Rate limiting\n- Caching strategies\n- Security best practices\n- Error handling`,
    
    debug: `Distributed tracing:\n- Centralized logging (ELK Stack)\n- Monitoring and alerting\n- Health checks\n- Incident response`,
    
    project: `Portfolio-worthy capstone projects (from IEEE Projects 2025-26):\n- Breast Cancer Detection (YOLOv8n/v11n Mammography): Web-based platform with Flask backend, SQLite for user data\n- Solar Panel Defect Detection (YOLOv8/v9 Electroluminescence): Detect cracks, scratches, dislocations in solar panels\n- Advanced Detection of AI-Generated Images (ResNet-50 + SE Attention, EfficientNetV2-S, MobileNetV3-Large): CIFAKE dataset with ensemble model\n- Sepsis Prediction (TCN + TinyML + XGBoost, Random Forest): Real-time prediction from physiological data\n- MediHelp: AI Medication Assistant (YOLO v9 + Gemini API): Real-time medication identification and guidance\n- Multimodal Misinformation Detection (BERT, RoBERTa, XLNet + CNN, MobileNet + SHAP): Flask app for text and image verification\n- Facial Expression Recognition System: Real-time emotion detection from video streams\n- E-Commerce Platform with AI Recommendations: Scalable SaaS with ML-powered suggestions\n\nMake it deployment-ready and production-grade!`,
    
    collaborate: `Orchestrating teams:\n- Agile methodology\n- Code governance\n- Documentation standards\n- CI/CD automation`,
  },
};

// Mock student data
export const mockStudents: Record<string, StudentProfile> = {
  'student1': {
    id: 'student1',
    name: 'Raj Polimetla',
    email: 'raj@campus.edu',
    academicYear: '2nd',
    bio: 'Web developer passionate about React and Node.js',
    skills: ['React', 'Node.js', 'TypeScript', 'Python'],
    joinedAt: new Date('2023-01-15'),
    uploadedProjects: ['proj1', 'proj2'],
    savedProjects: ['proj3', 'proj5'],
    likedProjects: ['proj1', 'proj2', 'proj3', 'proj4'],
    connections: ['student2', 'student3'],
    collaborations: ['collab1'],
  },
  'student2': {
    id: 'student2',
    name: 'Priya Singh',
    email: 'priya@campus.edu',
    academicYear: '2nd',
    bio: 'Mobile app developer',
    skills: ['React Native', 'Flutter', 'Firebase'],
    joinedAt: new Date('2023-02-20'),
    uploadedProjects: ['proj3', 'proj4'],
    savedProjects: ['proj1', 'proj2'],
    likedProjects: ['proj2', 'proj4', 'proj5'],
    connections: ['student1'],
    collaborations: ['collab1'],
  },
};

export const mockProjects: Record<string, Project> = {
  'proj1': {
    id: 'proj1',
    studentId: 'student1',
    studentName: 'Raj Polimetla',
    academicYear: '2nd',
    title: 'AI-Powered Study Assistant',
    description: 'A web app that helps students organize notes and create study plans',
    category: 'Web Development',
    uploadedAt: new Date('2024-01-15'),
    likes: 234,
    savedBy: ['student2', 'student3'],
    collaborators: ['student2'],
  },
  'proj2': {
    id: 'proj2',
    studentId: 'student1',
    studentName: 'Raj Polimetla',
    academicYear: '2nd',
    title: 'Real-time Chat Application',
    description: 'WebSocket-based chat with user authentication',
    category: 'Web Development',
    uploadedAt: new Date('2024-01-10'),
    likes: 189,
    savedBy: ['student2'],
    collaborators: [],
  },
  'proj3': {
    id: 'proj3',
    studentId: 'student2',
    studentName: 'Priya Singh',
    academicYear: '2nd',
    title: 'Mobile Banking App',
    description: 'Cross-platform mobile app with payment integration',
    category: 'Mobile App',
    uploadedAt: new Date('2024-01-08'),
    likes: 156,
    savedBy: ['student1'],
    collaborators: ['student1'],
  },
};

// Get student profile
export function getStudentProfile(studentId: string): StudentProfile | null {
  return mockStudents[studentId] || null;
}

// Get all students
export function getAllStudents(): StudentProfile[] {
  return Object.values(mockStudents);
}

// Like project
export function likeProject(projectId: string, studentId: string): boolean {
  const project = mockProjects[projectId];
  if (project && !project.savedBy.includes(studentId)) {
    project.likes += 1;
    if (!project.collaborators.includes(studentId)) {
      project.collaborators.push(studentId);
    }
    return true;
  }
  return false;
}

// Save project
export function saveProject(projectId: string, studentId: string): boolean {
  const project = mockProjects[projectId];
  const student = mockStudents[studentId];
  if (project && student && !student.savedProjects.includes(projectId)) {
    student.savedProjects.push(projectId);
    project.savedBy.push(studentId);
    return true;
  }
  return false;
}

// Join collaboration
export function joinCollaboration(projectId: string, studentId: string): boolean {
  const project = mockProjects[projectId];
  const student = mockStudents[studentId];
  if (project && student && !project.collaborators.includes(studentId)) {
    project.collaborators.push(studentId);
    student.collaborations.push(projectId);
    return true;
  }
  return false;
}

// Send connection request
export function sendConnectionRequest(fromId: string, toId: string): boolean {
  const fromStudent = mockStudents[fromId];
  const toStudent = mockStudents[toId];
  if (fromStudent && toStudent && !fromStudent.connections.includes(toId)) {
    return true;
  }
  return false;
}

// Accept connection
export function acceptConnection(studentId: string, otherStudentId: string): boolean {
  const student = mockStudents[studentId];
  const otherStudent = mockStudents[otherStudentId];
  if (student && otherStudent) {
    if (!student.connections.includes(otherStudentId)) {
      student.connections.push(otherStudentId);
    }
    if (!otherStudent.connections.includes(studentId)) {
      otherStudent.connections.push(studentId);
    }
    return true;
  }
  return false;
}

// Generate AI response
export function generateAIResponse(academicYear: AcademicYear, question: string): string {
  const lowerQ = question.toLowerCase();
  const responses = mockAIResponses[academicYear];
  
  if (lowerQ.includes('code') || lowerQ.includes('example') || lowerQ.includes('write')) {
    return responses.code;
  } else if (lowerQ.includes('debug') || lowerQ.includes('error') || lowerQ.includes('fix')) {
    return responses.debug;
  } else if (lowerQ.includes('project') || lowerQ.includes('idea') || lowerQ.includes('build')) {
    return responses.project;
  } else if (lowerQ.includes('collaborat') || lowerQ.includes('team') || lowerQ.includes('join')) {
    return responses.collaborate;
  }
  return responses.code;
}

// Simulate AI delay
export function simulateAIDelay(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 800 + Math.random() * 700);
  });
}
