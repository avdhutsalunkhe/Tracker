import React, { useState } from 'react';
import { useData } from '../../src/context/DataContext';
import { SubjectCards } from '../components/gate/SubjectCards';
import { TopicTable } from '../components/gate/TopicTable';
import { AddTopicModal } from '../components/gate/AddTopicModal';
import { SubjectModal } from '../components/gate/SubjectModal';
import { SeedSubjectsModal } from '../components/gate/SeedSubjectsModal';
import { GateSubject, GateTopic } from '../types';

export const GatePage: React.FC = () => {
  const { addSubject, updateSubject, seedPresetSubjects } = useData();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  // Modals state
  const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
  const [topicToEdit, setTopicToEdit] = useState<GateTopic | null>(null);
  const [defaultTopicSubjectId, setDefaultTopicSubjectId] = useState<string | undefined>(undefined);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<GateSubject | null>(null);

  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);

  const handleOpenAddTopic = (subjId?: string) => {
    setTopicToEdit(null);
    setDefaultTopicSubjectId(subjId || selectedSubjectId || undefined);
    setIsAddTopicOpen(true);
  };

  const handleEditTopic = (topic: GateTopic) => {
    setTopicToEdit(topic);
    setIsAddTopicOpen(true);
  };

  const handleOpenAddSubject = () => {
    setSubjectToEdit(null);
    setIsSubjectModalOpen(true);
  };

  const handleEditSubject = (subj: GateSubject) => {
    setSubjectToEdit(subj);
    setIsSubjectModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          GATE Preparation & Syllabus Tracker
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage subjects, log topic coverage, confidence ratings, and previous year questions (PYQs).
        </p>
      </div>

      {/* 1. Subject Cards Grid */}
      <SubjectCards
        selectedSubjectId={selectedSubjectId}
        onSelectSubject={setSelectedSubjectId}
        onOpenAddSubject={handleOpenAddSubject}
        onOpenSeedModal={() => setIsSeedModalOpen(true)}
        onEditSubject={handleEditSubject}
      />

      {/* 2. Topic Table & Filters */}
      <TopicTable
        selectedSubjectId={selectedSubjectId}
        onOpenAddTopic={handleOpenAddTopic}
        onEditTopic={handleEditTopic}
      />

      {/* Add / Edit Topic Modal */}
      <AddTopicModal
        isOpen={isAddTopicOpen}
        onClose={() => {
          setIsAddTopicOpen(false);
          setTopicToEdit(null);
        }}
        defaultSubjectId={defaultTopicSubjectId}
        topicToEdit={topicToEdit}
      />

      {/* Add / Edit Subject Modal */}
      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => {
          setIsSubjectModalOpen(false);
          setSubjectToEdit(null);
        }}
        onAdd={addSubject}
        isEditing={Boolean(subjectToEdit)}
        initialName={subjectToEdit?.name}
        initialColor={subjectToEdit?.color}
        onUpdate={async (name, color) => {
          if (subjectToEdit) {
            await updateSubject(subjectToEdit.id, name, color);
          }
        }}
      />

      {/* Seed Subjects Preset Modal */}
      <SeedSubjectsModal
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
        onSeed={seedPresetSubjects}
      />
    </div>
  );
};

