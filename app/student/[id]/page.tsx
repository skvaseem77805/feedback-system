'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useIsMobile } from '@/hooks/use-mobile';
import Link from 'next/link';
import { CollaborationsModal } from '@/components/CollaborationsModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
    Mail,
    Briefcase,
    Users,
    BookOpen,
    Network,
    Zap,
    ArrowLeft,
    Calendar,
    Linkedin,
    Github,
    MessageSquare,
    Share2,
    Heart,
    Bookmark,
    ExternalLink,
    ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import type { ApiStudent, ApiProject } from '@/lib/api';
import { apiLikeProject, apiSaveProject } from '@/lib/api';
import { getCurrentStudentId } from '@/lib/statsTracker';
import { useSafeBack } from '@/hooks/useSafeBack';
import { ShareBottomSheet } from '@/components/ShareBottomSheet';

export default function PublicStudentProfile() {
    const isMobile = useIsMobile();
    const router = useRouter();
    const params = useParams();
    const safeBack = useSafeBack();

    // Robust ID handling
    const rawId = params?.id as string;
    const id = rawId ? decodeURIComponent(rawId) : '';

    const [student, setStudent] = useState<ApiStudent | null>(null);
    const [projects, setProjects] = useState<ApiProject[]>([]);
    const [stats, setStats] = useState({ projectsUploaded: 0, connections: 0, collaborations: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [collabModalOpen, setCollabModalOpen] = useState(false);

    const [shareOpen, setShareOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const [shareTitle, setShareTitle] = useState("");
    const currentStudentId = getCurrentStudentId() ?? '';

    const toggleLike = async (project: ApiProject) => {
        if (!currentStudentId) return;
        try {
            const res = await apiLikeProject(project.id, currentStudentId);
            setProjects((prev) =>
                prev.map((q) =>
                    q.id === project.id ? { ...q, likes: res.likes, userHasLiked: res.liked } : q
                )
            );
        } catch (e) {
            console.error('Like error:', e);
        }
    };

    const toggleSave = async (project: ApiProject) => {
        if (!currentStudentId) return;
        try {
            const res = await apiSaveProject(project.id, currentStudentId);
            setProjects((prev) =>
                prev.map((q) => {
                    if (q.id !== project.id) return q;
                    const alreadySaved = q.savedBy.includes(currentStudentId);
                    let nextSavedBy = [...q.savedBy];
                    if (alreadySaved && !res.saved) {
                        nextSavedBy = nextSavedBy.filter(id => id !== currentStudentId);
                    } else if (!alreadySaved && res.saved) {
                        nextSavedBy.push(currentStudentId);
                    }
                    return { ...q, savedBy: nextSavedBy };
                })
            );
        } catch (e) {
            console.error('Save error:', e);
        }
    };

    const handleShareProject = (project: ApiProject) => {
        if (typeof window !== "undefined") {
            setShareUrl(`${window.location.origin}/project/${project.id}`);
            setShareTitle(project.title);
            setShareOpen(true);
        }
    };

    const handleShareStudent = () => {
        if (typeof window !== "undefined" && student) {
            setShareUrl(`${window.location.origin}/student/${student.id}`);
            setShareTitle(student.name);
            setShareOpen(true);
        }
    };


    useEffect(() => {
        if (!id) return;

        const loadData = async () => {
            try {
                setIsLoading(true);
                const { apiStudent, apiProjects, apiStats } = await import('@/lib/api');

                // Fetch student basic info first to validate ID
                const studentData = await apiStudent(id);

                if (!studentData) {
                    setError('Student not found');
                    setIsLoading(false);
                    return;
                }

                setStudent(studentData);

                // Then fetch supplementary data
                const [studentProjects, studentStats] = await Promise.all([
                    apiProjects({ studentId: id }),
                    apiStats(id).catch(() => ({ projectsUploaded: 0, connections: 0, collaborations: 0 })),
                ]);

                setProjects(studentProjects);
                setStats({
                    projectsUploaded: studentStats.projectsUploaded,
                    connections: studentStats.connections,
                    collaborations: studentStats.collaborations
                });
            } catch (err) {
                console.error('Error loading profile:', err);
                setError('Failed to load profile');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen gradient-bg">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(10vh-64px)]">
                    <p className="text-muted-foreground animate-pulse">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="min-h-screen gradient-bg">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] space-y-4">
                    <h2 className="text-2xl font-bold text-muted-foreground">{error || 'Student Not Found'}</h2>
                    <Button onClick={() => safeBack('/select-student')} variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (isMobile) {
        return (
            <div className="min-h-screen bg-background pb-20 select-none antialiased">
                <Navbar />

                <main className="px-4 py-4 space-y-5">
                    {/* Main Card */}
                    <Card className="p-5 rounded-2xl bg-card border border-border/40 shadow-sm space-y-4">
                        {/* Image + Info Row */}
                        <div className="flex gap-4 items-center">
                            <div className="relative flex-shrink-0">
                                {student.avatar ? (
                                    <img
                                        src={student.avatar}
                                        alt={student.name}
                                        className="w-20 h-20 rounded-full object-cover border-4 border-primary/10"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                                        {getInitials(student.name)}
                                    </div>
                                )}
                                {/* Available for Collaboration Green Dot Indicator */}
                                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-card" />
                            </div>

                             <div className="flex-1 min-w-0 space-y-1 text-left">
                                <div className="flex items-center justify-between">
                                    <h2 className={`font-extrabold text-foreground tracking-tight leading-tight break-words ${
                                        student.name.length > 25 ? 'text-[13px]' :
                                        student.name.length > 18 ? 'text-base' : 'text-lg'
                                    }`}>
                                        {student.name}
                                    </h2>
                                    <button
                                        onClick={handleShareStudent}
                                        className="p-1.5 rounded-full hover:bg-muted active:scale-95 transition-transform"
                                    >
                                        <Share2 className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </div>
                                <p className="text-xs font-semibold text-muted-foreground">
                                    {student.academicYear} Year • {student.department} • Section {student.section}
                                </p>
                                <p className="text-[10px] text-muted-foreground/80 truncate font-medium">
                                    Sir C.R. Reddy College of Engineering
                                </p>
                                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 font-bold text-[9px] mt-1.5">
                                    <span className="w-1 h-1 rounded-full bg-green-500" />
                                    Available for Collaboration
                                </div>
                            </div>
                        </div>

                        {/* Metrics Row */}
                        <div className="grid grid-cols-2 gap-4 py-3 border-t border-b border-border/20 text-center">
                            <div>
                                <div className="font-extrabold text-foreground text-base leading-tight">
                                    {stats.projectsUploaded}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-bold">Projects</span>
                            </div>
                            <div className="border-l border-border/20">
                                <div className="font-extrabold text-foreground text-base leading-tight">
                                    {stats.connections}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-bold">Connections</span>
                            </div>
                        </div>
                    </Card>

                    {/* Skills Section */}
                    <div className="space-y-2.5 text-left">
                        <h3 className="font-extrabold text-base tracking-tight text-foreground">Skills</h3>
                        {student.skills && student.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {student.skills.map((skill) => (
                                    <Badge key={skill} variant="secondary" className="text-[10px] py-1 px-3 rounded-lg border-none shadow-none font-bold text-foreground">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <Card className="p-4 text-center bg-card/45 border-border/40 rounded-2xl">
                                <p className="text-xs text-muted-foreground">No skills listed.</p>
                            </Card>
                        )}
                    </div>

                    {/* Bio Section */}
                    <div className="space-y-2.5 text-left max-w-full min-w-0">
                        <h3 className="font-extrabold text-base tracking-tight text-foreground">Bio</h3>
                        {student.bio && student.bio.trim() ? (
                            <Card className="p-4 bg-card/45 border-border/40 rounded-2xl overflow-hidden max-w-full min-w-0">
                                <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] max-w-full min-w-0">
                                    {student.bio.trim()}
                                </p>
                            </Card>
                        ) : (
                            <Card className="p-4 text-center bg-card/45 border-border/40 rounded-2xl">
                                <p className="text-xs text-muted-foreground">No bio added yet.</p>
                            </Card>
                        )}
                    </div>

                    {/* Projects Section Header */}
                    <div className="space-y-3 text-left">
                        <button
                            type="button"
                            onClick={() => router.push(`/student/${encodeURIComponent(id)}/projects`)}
                            className="w-full flex justify-between items-center p-4 bg-card/50 hover:bg-card/80 border border-border/45 rounded-2xl shadow-sm active:scale-[0.99] transition-all cursor-pointer group"
                        >
                            <h3 className="font-extrabold text-base tracking-tight text-foreground flex items-center gap-2">
                                Projects
                            </h3>
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                        </button>
                    </div>

                    {/* Connect Section */}
                    <div className="space-y-3 pb-6">
                        <h3 className="font-extrabold text-base tracking-tight text-foreground text-center">Connect</h3>
                        <div className="flex gap-4 justify-center items-center pt-1">
                            {student.githubUrl && (
                                <a
                                    href={student.githubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 rounded-full bg-muted/40 hover:bg-muted flex items-center justify-center border border-border/40 active:scale-90 transition-transform"
                                >
                                    <Github className="w-5 h-5 text-foreground" />
                                </a>
                            )}
                            {student.linkedinUrl && (
                                <a
                                    href={student.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-12 h-12 rounded-full bg-muted/40 hover:bg-muted flex items-center justify-center border border-border/40 active:scale-90 transition-transform"
                                >
                                    <Linkedin className="w-5 h-5 text-blue-600 fill-blue-600/10" />
                                </a>
                            )}
                            {student.email && (
                                <a
                                    href={`mailto:${student.email}`}
                                    className="w-12 h-12 rounded-full bg-muted/40 hover:bg-muted flex items-center justify-center border border-border/40 active:scale-90 transition-transform"
                                >
                                    <Mail className="w-5 h-5 text-foreground" />
                                </a>
                            )}
                        </div>
                    </div>
                </main>

                <CollaborationsModal
                    studentId={id}
                    isOpen={collabModalOpen}
                    onClose={() => setCollabModalOpen(false)}
                />
                <ShareBottomSheet
                    isOpen={shareOpen}
                    onClose={() => setShareOpen(false)}
                    shareUrl={shareUrl}
                    title={shareTitle}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-bg">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Button
                    variant="ghost"
                    className="mb-6 hover:bg-primary/10"
                    onClick={() => safeBack('/select-student')}
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Directory
                </Button>

                {/* Profile Header Card */}
                <Card className="p-8 mb-8 bg-card/50 backdrop-blur-sm border-primary/20">
                    <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                        {/* Profile Photo */}
                        <div className="relative group">
                            {student.avatar ? (
                                <img
                                    src={student.avatar}
                                    alt={student.name}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/30"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-3xl font-bold">
                                    {getInitials(student.name)}
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="flex-1 space-y-3">
                            <div>
                                <div className="flex justify-between items-center w-full">
                                    <h1 className={`font-bold tracking-tight break-words leading-tight ${
                                        student.name.length > 25 ? 'text-xl' :
                                        student.name.length > 18 ? 'text-2xl' : 'text-3xl'
                                    }`}>{student.name}</h1>
                                    <Button
                                        onClick={handleShareStudent}
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full hover:bg-muted p-2 h-9 w-9 animate-none shrink-0"
                                    >
                                        <Share2 className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                                    </Button>
                                </div>
                                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                    <Briefcase className="w-4 h-4" />
                                    {student.academicYear} Year • {student.department} • Section {student.section}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4">
                                {student.email && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="w-4 h-4" />
                                        {student.email}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">ID: {student.id}</span>
                                </div>
                            </div>

                            {student.bio && (
                                <p className="text-sm text-muted-foreground max-w-2xl mt-2">
                                    {student.bio}
                                </p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2">
                            {student.linkedinUrl ? (
                                <Button
                                    onClick={() => window.open(student.linkedinUrl, '_blank')}
                                    className="smooth-button bg-blue-600 text-white hover:bg-blue-700"
                                >
                                    <Linkedin className="w-4 h-4 mr-2" />
                                    Connect on LinkedIn
                                </Button>
                            ) : (
                                <Button disabled variant="outline" className="opacity-50">
                                    <Linkedin className="w-4 h-4 mr-2" />
                                    No LinkedIn
                                </Button>
                            )}
                            {student.githubUrl ? (
                                <Button
                                    asChild
                                    className="smooth-button bg-gray-800 text-white hover:bg-gray-900"
                                >
                                    <a href={student.githubUrl} target="_blank" rel="noopener noreferrer">
                                        <Github className="w-4 h-4 mr-2" />
                                        GitHub
                                    </a>
                                </Button>
                            ) : (
                                <Button disabled variant="outline" className="opacity-50">
                                    <Github className="w-4 h-4 mr-2" />
                                    No GitHub
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-4 mb-8">
                    {[
                        {
                            icon: BookOpen,
                            label: 'Projects Uploaded',
                            value: stats.projectsUploaded,
                            color: 'from-blue-500 to-blue-600',
                            clickable: false,
                            description: 'Projects created by this user.',
                        },
                        {
                            icon: Zap,
                            label: 'Collaborations',
                            value: stats.collaborations,
                            color: 'from-purple-500 to-purple-600',
                            clickable: true,
                            description: 'Projects where this user is a collaborator.',
                        },
                    ].map((stat, idx) => (
                        <Card
                            key={idx}
                            onClick={stat.clickable ? () => setCollabModalOpen(true) : undefined}
                            className={`p-6 bg-card/50 backdrop-blur-sm border-primary/20 hover-lift smooth-transition relative overflow-hidden ${
                                stat.clickable ? 'cursor-pointer hover:border-primary/50 hover:bg-card/75' : ''
                            }`}
                        >
                            <div
                                className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 hover:opacity-5 smooth-transition pointer-events-none`}
                            />
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                                        <stat.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                        <p className="text-3xl font-bold text-balance">{stat.value}</p>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {stat.description}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Content Tabs - Matching ProfilePage structure */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="w-full justify-start border-b rounded-none p-0 h-auto bg-transparent gap-6">
                        <TabsTrigger
                            value="overview"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                        >
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="projects"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                        >
                            Projects
                        </TabsTrigger>
                        <TabsTrigger
                            value="skills"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-2"
                        >
                            Skills
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4 pt-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Student Details
                                </h3>
                                <div className="space-y-4 text-sm">
                                    <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-2">
                                        <span className="text-muted-foreground">Department</span>
                                        <span className="col-span-2 font-medium">{student.department}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-2">
                                        <span className="text-muted-foreground">Year</span>
                                        <span className="col-span-2 font-medium">{student.year} ({student.academicYear})</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-2">
                                        <span className="text-muted-foreground">Course</span>
                                        <span className="col-span-2 font-medium">{student.course || 'B.Tech'}</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 pb-2">
                                        <span className="text-muted-foreground">Section</span>
                                        <span className="col-span-2 font-medium">{student.section}</span>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-accent" />
                                    Bio
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {student.bio || 'No bio provided.'}
                                </p>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="projects" className="space-y-4 pt-4">
                        <h2 className="text-xl font-bold mb-4">Uploaded Projects</h2>
                        {projects.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {projects.map((project) => {
                                    const isLiked = !!project.userHasLiked;
                                    const isSaved = currentStudentId ? project.savedBy?.includes(currentStudentId) : false;

                                    return (
                                        <Card key={project.id} className="p-5 bg-card/50 backdrop-blur-sm border-primary/20 hover-lift smooth-transition group flex flex-col">
                                            <div className="flex-1 space-y-3 mb-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-bold text-lg group-hover:text-primary smooth-transition line-clamp-2">
                                                            {project.title}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground mt-1">By {project.studentName}</p>
                                                    </div>
                                                    <div className="flex gap-1 flex-shrink-0">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleLike(project)}
                                                            className={`smooth-transition ${isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                                                        >
                                                            <Heart className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleSave(project)}
                                                            className={`smooth-transition ${isSaved ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`}
                                                        >
                                                            <Bookmark className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>

                                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground font-semibold">
                                                    <span>{project.academicYear === 'final' ? 'Final' : project.academicYear} Year • {project.studentDepartment || 'CSE'} • Section {project.studentSection || 'E'}</span>
                                                </div>
                                            </div>

                                            {project.thumbnailUrl && (
                                                <div className="w-full h-48 mb-4 rounded-md overflow-hidden bg-muted/20 border border-border/50">
                                                    <img
                                                        src={project.thumbnailUrl}
                                                        alt={project.title}
                                                        className="w-full h-full object-cover hover:scale-105 smooth-transition duration-500"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            )}

                                            <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground py-3 border-t border-b border-border/50 mb-4">
                                                <div>
                                                    <div className="font-bold text-foreground">{project.likes}</div>
                                                    Likes
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground">{project.views ?? 0}</div>
                                                    Views
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground">{project.savedBy?.length ?? 0}</div>
                                                    Saved
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <Link href={`/projects/${encodeURIComponent(project.id)}?from=student`} className="flex-1">
                                                    <Button variant="outline" size="sm" className="w-full smooth-button gap-2 bg-transparent">
                                                        <ExternalLink className="w-4 h-4" />
                                                        View Project
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => handleShareProject(project)}
                                                    className="smooth-button text-muted-foreground hover:text-foreground h-9 w-9 border border-border/40 rounded-xl shrink-0"
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
                                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                No projects uploaded yet.
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="skills" className="space-y-4 pt-4">
                        <h2 className="text-xl font-bold mb-4">Skills & Expertise</h2>
                        {student.skills && student.skills.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {student.skills.map(skill => (
                                    <Badge key={skill} variant="outline" className="text-base py-1 px-3 border-primary/30 bg-primary/5">
                                        {skill}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <div className="text-muted-foreground py-8">No skills listed.</div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

             <CollaborationsModal
                studentId={id}
                isOpen={collabModalOpen}
                onClose={() => setCollabModalOpen(false)}
            />
            <ShareBottomSheet
                isOpen={shareOpen}
                onClose={() => setShareOpen(false)}
                shareUrl={shareUrl}
                title={shareTitle}
            />
        </div>
    );
}
