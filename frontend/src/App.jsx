import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Sparkles, FolderCheck, ListOrdered, BookOpen } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NewProjectModal from './components/NewProjectModal';
import OneClickProductionModal from './components/OneClickProductionModal';

// Views
import DashboardView from './views/DashboardView';
import CategoryHubView from './views/CategoryHubView';
import ContentCalendarView from './views/ContentCalendarView';
import ResearchSourcesView from './views/ResearchSourcesView';
import TopicResearchView from './views/TopicResearchView';
import BibleBooksView from './views/BibleBooksView';
import HistoricalStoriesView from './views/HistoricalStoriesView';
import ScriptStudioView from './views/ScriptStudioView';
import AccuracyCheckerView from './views/AccuracyCheckerView';
import VoiceStudioView from './views/VoiceStudioView';
import ImageStudioView from './views/ImageStudioView';
import VideoProductionView from './views/VideoProductionView';
import ThumbnailStudioView from './views/ThumbnailStudioView';
import ChapterProductionView from './views/ChapterProductionView';
import IdeogramStudioView from './views/IdeogramStudioView';
import FinalPackageLibraryView from './views/FinalPackageLibraryView';
import SeoStudioView from './views/SeoStudioView';
import ReadyToUploadView from './views/ReadyToUploadView';
import AnalyticsView from './views/AnalyticsView';
import SettingsView from './views/SettingsView';
import CreateVideoView from './views/CreateVideoView';
import ErrorBoundary from './components/ErrorBoundary';

import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isOneClickModalOpen, setIsOneClickModalOpen] = useState(false);
  const [productionProject, setProductionProject] = useState(null);

  // App state
  const [stats, setStats] = useState(null);
  const [bibleBooks, setBibleBooks] = useState([]);
  const [historicalStories, setHistoricalStories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);

  // Load initial data from backend
  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      const [statsRes, booksRes, storiesRes, projectsRes] = await Promise.all([
        api.getDashboardStats().catch(() => ({ data: null })),
        api.getBibleBooks().catch(() => ({ data: [] })),
        api.getHistoricalStories().catch(() => ({ data: [] })),
        api.getProjects().catch(() => ({ data: [] })),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (booksRes.data) setBibleBooks(booksRes.data);
      if (storiesRes.data) setHistoricalStories(storiesRes.data);
      if (projectsRes.data) {
        setProjects(projectsRes.data);
        if (projectsRes.data.length > 0 && !activeProjectId) {
          setActiveProjectId(projectsRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading initial studio data:', err);
    }
  }

  async function handleCreateProject(projectData) {
    let project = projectData;
    if (!projectData.id) {
      const res = await api.createProject(projectData);
      if (!res.success || !res.data) return;
      project = res.data;
    }
    await loadAllData();
    setActiveProjectId(project.id);
    setProductionProject(project);
    setIsOneClickModalOpen(true);
  }

  function handleStartProjectForBook(book) {
    handleCreateProject({
      title: `${book.name}: The Complete Explanation`,
      topic: `${book.name} - ${book.central_theme}`,
      category: 'BIBLE_BOOK',
      format: 'LONG_FORM',
      bible_book: book.name,
      chapter_start: 1,
      chapter_end: book.total_chapters,
      bible_translation: 'WEB',
    });
  }

  function handleStartProjectForStory(story) {
    handleCreateProject({
      title: story.title,
      topic: story.educational_summary,
      category: 'HISTORICAL_STORY',
      format: 'SHORTS',
      verses_referenced: story.scripture_references,
      bible_translation: 'WEB',
    });
  }

  return (
    <div className="flex h-screen bg-[#090D16] text-slate-100 overflow-hidden font-sans">
      {/* 1. Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 2. Main Studio Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          activeTab={activeTab}
          onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        />

        {/* Scrollable Content View */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <ErrorBoundary key={activeTab} onNavigateHome={() => setActiveTab('dashboard')}>
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              projects={projects}
              bibleBooks={bibleBooks}
              onSelectProject={(id) => {
                setActiveProjectId(id);
                setActiveTab('ready-to-upload');
              }}
              onOpenNewProject={() => setIsNewProjectModalOpen(true)}
              onOpenProduction={(project) => {
                setProductionProject(project);
                setIsOneClickModalOpen(true);
              }}
              onCreateProject={handleCreateProject}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'create-video' && (
            <CreateVideoView
              onProjectCreated={handleCreateProject}
              bibleBooks={bibleBooks}
            />
          )}

          {activeTab === 'category-hub' && (
            <CategoryHubView
              onStartProject={handleCreateProject}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'content-calendar' && (
            <ContentCalendarView
              onStartProject={handleCreateProject}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'research-sources' && (
            <ResearchSourcesView
              onStartProject={handleCreateProject}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'topic-research' && (
            <TopicResearchView
              onStartProject={handleCreateProject}
            />
          )}

          {activeTab === 'chapter-production' && (
            <ChapterProductionView
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'bible-books' && (
            <BibleBooksView
              books={bibleBooks}
              onStartProjectForBook={handleStartProjectForBook}
            />
          )}

          {activeTab === 'historical-stories' && (
            <HistoricalStoriesView
              stories={historicalStories}
              onStartProjectForStory={handleStartProjectForStory}
            />
          )}

          {activeTab === 'script-studio' && (
            <ScriptStudioView
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={setActiveProjectId}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'accuracy-checker' && (
            <AccuracyCheckerView
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'voice-studio' && (
            <VoiceStudioView
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'image-studio' && (
            <ImageStudioView
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'video-production' && (
            <VideoProductionView
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'ideogram-studio' && (
            <IdeogramStudioView
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'thumbnail-studio' && (
            <ThumbnailStudioView
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'seo-studio' && (
            <SeoStudioView
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'ready-to-upload' && (
            <ReadyToUploadView
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView books={bibleBooks} />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
          </ErrorBoundary>
        </main>
      </div>

      {/* 3. New Project Creator Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onProjectCreated={handleCreateProject}
        bibleBooks={bibleBooks}
      />

      {/* 4. One-Click Automated Production Modal */}
      {isOneClickModalOpen && productionProject && (
        <OneClickProductionModal
          key={productionProject.id}
          isOpen={isOneClickModalOpen}
          onClose={() => {
            setIsOneClickModalOpen(false);
            setProductionProject(null);
          }}
          project={productionProject}
          onComplete={() => {
            loadAllData();
          }}
        />
      )}
      {/* 5. Mobile Bottom Navigation Bar (Android & iOS) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0C1322]/95 backdrop-blur-lg border-t border-slate-800/80 z-40 flex items-center justify-around px-2 shadow-2xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-all ${activeTab === 'dashboard' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setIsNewProjectModalOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-[10px] font-bold transition-all text-amber-400 active:scale-95"
        >
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span>+ New</span>
        </button>

        <button
          onClick={() => setActiveTab('ready-to-upload')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-all ${activeTab === 'ready-to-upload' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <FolderCheck className="w-5 h-5" />
          <span>Videos</span>
        </button>

        <button
          onClick={() => setActiveTab('chapter-production')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-all ${activeTab === 'chapter-production' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <ListOrdered className="w-5 h-5" />
          <span>Queue</span>
        </button>

        <button
          onClick={() => setActiveTab('bible-books')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-[10px] font-semibold transition-all ${activeTab === 'bible-books' ? 'text-amber-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <BookOpen className="w-5 h-5" />
          <span>Books</span>
        </button>
      </nav>
    </div>
  );
}
