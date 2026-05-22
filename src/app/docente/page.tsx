"use client";

import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { clearAuthSession, readAuthSession } from "@/features/auth/session";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api";
import type {
  Group,
  GeneralRankingItem,
  GroupInviteCreatedResponse,
  GroupInviteNotification,
  CommitListItem,
  CommitListResponse,
  GroupRankingItem,
  GithubSyncResponse,
  GroupShareLinkResponse,
  GroupShareResponse,
  GroupStudent,
  GroupStudentCandidate,
  ParticipantQuickResult,
  TeacherShareTarget,
} from "@/types";

type ActiveModal = "group" | "participant" | null;
type SuccessModal = {
  title: string;
  message: string;
} | null;

type ShareModalState = {
  groupId: number;
  groupName: string;
} | null;

type GroupMembersModalState = {
  groupId: number;
  groupName: string;
} | null;

type GroupRankingModalState = {
  groupId: number;
  groupName: string;
} | null;

type MemberCommitsModalState = {
  usuarioId: number;
  nombre: string;
  username: string;
} | null;

type StudentInviteModal = {
  groupId: number;
  groupName: string;
  link: string | null;
  isLoading: boolean;
} | null;

const initialGroupForm = {
  nombre: "",
  carrera: "",
  fecha_inicio: "",
  fecha_cierre: "",
};

const initialStudentForm = {
  nombre: "",
  grupo_id: "",
  github_username: "",
};

export default function DocentePage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | undefined>(undefined);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [cardMenuGroupId, setCardMenuGroupId] = useState<number | null>(null);
  const [groupForm, setGroupForm] = useState(initialGroupForm);
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [successModal, setSuccessModal] = useState<SuccessModal>(null);
  const [shareModal, setShareModal] = useState<ShareModalState>(null);
  const [membersModal, setMembersModal] = useState<GroupMembersModalState>(null);
  const [shareQuery, setShareQuery] = useState("");
  const [shareTargets, setShareTargets] = useState<TeacherShareTarget[]>([]);
  const [selectedShareTarget, setSelectedShareTarget] = useState<TeacherShareTarget | null>(null);
  const [isSearchingTargets, setIsSearchingTargets] = useState(false);
  const [isSubmittingShare, setIsSubmittingShare] = useState(false);
  const [isGeneratingShareLink, setIsGeneratingShareLink] = useState(false);
  const [generatedShareLink, setGeneratedShareLink] = useState("");
  const [inviteNotifications, setInviteNotifications] = useState<GroupInviteNotification[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [acceptShareToken, setAcceptShareToken] = useState("");
  const [isAcceptingShare, setIsAcceptingShare] = useState(false);
  const [groupMembers, setGroupMembers] = useState<GroupStudent[]>([]);
  const [candidateStudents, setCandidateStudents] = useState<GroupStudentCandidate[]>([]);
  const [selectedCandidateParticipantId, setSelectedCandidateParticipantId] = useState<string>("");
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmittingMemberChange, setIsSubmittingMemberChange] = useState(false);
  const [memberCommitsModal, setMemberCommitsModal] = useState<MemberCommitsModalState>(null);
  const [memberCommits, setMemberCommits] = useState<CommitListItem[]>([]);
  const [isLoadingMemberCommits, setIsLoadingMemberCommits] = useState(false);
  const [isSyncingMemberCommits, setIsSyncingMemberCommits] = useState(false);
  const [rankingModal, setRankingModal] = useState<GroupRankingModalState>(null);
  const [rankingItems, setRankingItems] = useState<GroupRankingItem[]>([]);
  const [generalRankingItems, setGeneralRankingItems] = useState<GeneralRankingItem[]>([]);
  const [generalRankingMetric, setGeneralRankingMetric] = useState<"todo" | "commits" | "contribuciones">("todo");
  const [generalRankingPeriod, setGeneralRankingPeriod] = useState<"7d" | "30d" | "90d" | "1y" | "all" | "custom">("1y");
  const [generalRankingFromDate, setGeneralRankingFromDate] = useState("");
  const [generalRankingToDate, setGeneralRankingToDate] = useState("");
  const [isGeneralRankingModalOpen, setIsGeneralRankingModalOpen] = useState(false);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [isLoadingGeneralRanking, setIsLoadingGeneralRanking] = useState(false);
  const [isRefreshingRanking, setIsRefreshingRanking] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; currentName: string } | null>(null);
  const [groupSearch, setGroupSearch] = useState("");
  const [filterCarrera, setFilterCarrera] = useState("all");
  const [filterSemestre, setFilterSemestre] = useState("all");
  const [groupsViewMode, setGroupsViewMode] = useState<"cards" | "list">("cards");
  const [isCreatingNewCompetitor, setIsCreatingNewCompetitor] = useState(false);
  const [newCompetitorForm, setNewCompetitorForm] = useState({ nombre: "", github_username: "" });
  const [isSubmittingNewCompetitor, setIsSubmittingNewCompetitor] = useState(false);
  const [competitorSearch, setCompetitorSearch] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);
  const [editingMemberForm, setEditingMemberForm] = useState({ nombre: "", github_username: "" });
  const [isSubmittingMemberEdit, setIsSubmittingMemberEdit] = useState(false);
  const [removeConfirmModal, setRemoveConfirmModal] = useState<{ participantId: number; nombre: string } | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [studentInviteModal, setStudentInviteModal] = useState<StudentInviteModal>(null);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const session = readAuthSession();
      setAccessToken(session?.access_token);
      setAcceptShareToken(new URLSearchParams(window.location.search).get("invite") || "");
      setIsHydrated(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (shareModal) {
        setShareModal(null);
        return;
      }
      if (rankingModal) {
        setRankingModal(null);
        return;
      }
      if (isGeneralRankingModalOpen) {
        setIsGeneralRankingModalOpen(false);
        return;
      }
      if (memberCommitsModal) {
        setMemberCommitsModal(null);
        return;
      }
      if (removeConfirmModal) {
        setRemoveConfirmModal(null);
        return;
      }
      if (studentInviteModal) {
        setStudentInviteModal(null);
        setCopiedInviteLink(false);
        return;
      }
      if (membersModal) {
        setMembersModal(null);
        setIsCreatingNewCompetitor(false);
        setNewCompetitorForm({ nombre: "", github_username: "" });
        setCompetitorSearch("");
        setSelectedCandidateParticipantId("");
        setEditingMemberId(null);
        setEditingMemberForm({ nombre: "", github_username: "" });
        return;
      }
      if (successModal) {
        setSuccessModal(null);
        return;
      }
      if (isNotificationsOpen) {
        setIsNotificationsOpen(false);
        return;
      }
      if (activeModal) {
        setActiveModal(null);
        setEditingGroup(null);
        setGroupForm(initialGroupForm);
        return;
      }
      if (cardMenuGroupId !== null) {
        setCardMenuGroupId(null);
      }
    }

    window.addEventListener("keydown", handleEscapeKey);
    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [activeModal, cardMenuGroupId, isNotificationsOpen, memberCommitsModal, membersModal, rankingModal, shareModal, successModal, isGeneralRankingModalOpen, removeConfirmModal, studentInviteModal]);

  const availableCarreras = Array.from(new Set(groups.map((group) => group.carrera))).sort((a, b) => a.localeCompare(b));

  const filteredGroups = useMemo(
    () =>
      groups.filter((group) => {
        const matchesSearch =
          group.nombre.toLowerCase().includes(groupSearch.trim().toLowerCase()) ||
          group.carrera.toLowerCase().includes(groupSearch.trim().toLowerCase());
        const matchesCarrera = filterCarrera === "all" || group.carrera === filterCarrera;
        return matchesSearch && matchesCarrera;
      }),
    [filterCarrera, groupSearch, groups],
  );
  const filteredGroupIdsKey = filteredGroups.map((group) => group.id).join(",");
  const generalMetricLabel =
    generalRankingMetric === "commits"
      ? "Commits"
      : generalRankingMetric === "contribuciones"
        ? "Contribuciones GitHub"
        : "Actividad";

  useEffect(() => {
    async function loadDocenteGroups() {
      if (!accessToken) {
        setGroups([]);
        setIsLoadingGroups(false);
        return;
      }

      setIsLoadingGroups(true);
      try {
        const myGroups = await apiGet<Group[]>("/proyectos", accessToken);
        setGroups(myGroups);
      } catch (error) {
        setFeedback(error instanceof ApiError ? error.detail : "No se pudieron cargar tus proyectos.");
      } finally {
        setIsLoadingGroups(false);
      }
    }

    void loadDocenteGroups();
  }, [accessToken]);

  useEffect(() => {
    async function loadInviteNotifications() {
      if (!accessToken) {
        setInviteNotifications([]);
        return;
      }

      setIsLoadingInvites(true);
      try {
        const invites = await apiGet<GroupInviteNotification[]>("/proyectos/invitaciones/mias", accessToken);
        setInviteNotifications(invites);
      } catch {
        setInviteNotifications([]);
      } finally {
        setIsLoadingInvites(false);
      }
    }

    void loadInviteNotifications();
  }, [accessToken]);

  useEffect(() => {
    async function loadGeneralRanking() {
      if (!accessToken) {
        setGeneralRankingItems([]);
        setIsLoadingGeneralRanking(false);
        return;
      }

      if (filteredGroups.length === 0) {
        setGeneralRankingItems([]);
        setIsLoadingGeneralRanking(false);
        return;
      }

      setIsLoadingGeneralRanking(true);
      try {
        const params = new URLSearchParams({
          metric: generalRankingMetric,
          period: generalRankingPeriod,
          group_ids: filteredGroupIdsKey,
        });
        if (generalRankingPeriod === "custom") {
          if (!generalRankingFromDate || !generalRankingToDate) {
            setGeneralRankingItems([]);
            setIsLoadingGeneralRanking(false);
            return;
          }
          params.set("from_date", generalRankingFromDate);
          params.set("to_date", generalRankingToDate);
        }

        const items = await apiGet<GeneralRankingItem[]>(`/ranking/general?${params.toString()}`, accessToken);
        setGeneralRankingItems(items);
      } catch {
        setGeneralRankingItems([]);
      } finally {
        setIsLoadingGeneralRanking(false);
      }
    }

    void loadGeneralRanking();
  }, [
    accessToken,
    filteredGroupIdsKey,
    filteredGroups,
    generalRankingFromDate,
    generalRankingMetric,
    generalRankingPeriod,
    generalRankingToDate,
  ]);

  async function handleSubmitGroup(event: { preventDefault(): void }) {
    event.preventDefault();
    setIsSubmittingGroup(true);
    setFeedback(editingGroup ? "Actualizando proyecto..." : "Creando proyecto...");

    try {
      if (!accessToken) {
        setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
        return;
      }

      const payload = {
        nombre: groupForm.nombre,
        carrera: groupForm.carrera,
        fecha_inicio: groupForm.fecha_inicio,
        fecha_cierre: groupForm.fecha_cierre,
      };

      if (editingGroup) {
        const updatedGroup = await apiPut<Group>(`/proyectos/${editingGroup.id}`, payload, accessToken);
        setGroups((current) => current.map((group) => (group.id === updatedGroup.id ? updatedGroup : group)));
        setFeedback(`Proyecto ${updatedGroup.nombre} actualizado correctamente.`);
        setSuccessModal({
          title: "Proyecto actualizado",
          message: `El proyecto ${updatedGroup.nombre} se actualizo correctamente.`,
        });
      } else {
        const createdGroup = await apiPost<Group>("/proyectos", payload, accessToken);
        setGroups((current) => [createdGroup, ...current]);
        setFeedback(`Proyecto ${createdGroup.nombre} creado correctamente.`);
        setSuccessModal({
          title: "Proyecto creado",
          message: `El proyecto ${createdGroup.nombre} se registro correctamente.`,
        });
      }

      setGroupForm(initialGroupForm);
      setEditingGroup(null);
      setActiveModal(null);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo guardar el proyecto.");
    } finally {
      setIsSubmittingGroup(false);
    }
  }

  function openGroupCreateModal() {
    setEditingGroup(null);
    setGroupForm(initialGroupForm);
    setActiveModal("group");
  }

  function openGroupEditModal(group: Group) {
    setEditingGroup(group);
    setGroupForm({
      nombre: group.nombre,
      carrera: group.carrera,
      fecha_inicio: group.fecha_inicio.slice(0, 16),
      fecha_cierre: group.fecha_cierre.slice(0, 16),
    });
    setCardMenuGroupId(null);
    setActiveModal("group");
  }

  async function openStudentInviteModal(group: Group) {
    setCardMenuGroupId(null);
    setStudentInviteModal({ groupId: group.id, groupName: group.nombre, link: null, isLoading: true });
    try {
      const res = await apiPost<{ registro_url: string }>(
        `/proyectos/${group.id}/invitar-alumnos`,
        {},
        accessToken,
      );
      const fullLink = `${window.location.origin}${res.registro_url}`;
      setStudentInviteModal((prev) => prev ? { ...prev, link: fullLink, isLoading: false } : null);
    } catch {
      setStudentInviteModal((prev) => prev ? { ...prev, link: null, isLoading: false } : null);
    }
  }

  async function copyInviteLink(link: string) {
    await navigator.clipboard.writeText(link);
    setCopiedInviteLink(true);
    setTimeout(() => setCopiedInviteLink(false), 2500);
  }

  async function handleCreateCompetitorInModal(event: { preventDefault(): void }) {
    event.preventDefault();
    
    if (!membersModal || !accessToken) {
      setFeedback("Sesión inválida. Por favor recarga la página.");
      return;
    }

    if (!newCompetitorForm.nombre.trim()) {
      setFeedback("El nombre del competidor es obligatorio.");
      return;
    }

    setIsSubmittingNewCompetitor(true);
    try {
      const participant = await apiPost<ParticipantQuickResult>(
        "/participantes/registro-rapido",
        {
          nombre: newCompetitorForm.nombre.trim(),
          grupo_id: membersModal.groupId,
          github_username: newCompetitorForm.github_username.trim() || null,
        },
        accessToken,
      );
      
      // Recargar miembros del grupo
      await loadGroupMembersContext(membersModal.groupId, accessToken);
      
      setFeedback(`Competidor ${participant.nombre} agregado exitosamente.`);
      setSuccessModal({
        title: "Competidor agregado",
        message: `${participant.nombre} se agregó al grupo. Username: @${participant.username}`,
      });
      setNewCompetitorForm({ nombre: "", github_username: "" });
      setIsCreatingNewCompetitor(false);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo agregar el competidor.");
    } finally {
      setIsSubmittingNewCompetitor(false);
    }
  }

  async function handleUpdateMember() {
    if (!membersModal || !accessToken || editingMemberId === null) {
      setFeedback("Error en la sesión. Por favor recarga la página.");
      return;
    }

    if (!editingMemberForm.nombre.trim()) {
      setFeedback("El nombre del competidor es obligatorio.");
      return;
    }

    setIsSubmittingMemberEdit(true);
    try {
      await apiPut(
        `/participantes/${editingMemberId}`,
        {
          nombre: editingMemberForm.nombre.trim(),
          github_username: editingMemberForm.github_username.trim() || null,
        },
        accessToken,
      );

      // Recargar miembros del grupo
      await loadGroupMembersContext(membersModal.groupId, accessToken);

      setFeedback("Competidor actualizado exitosamente.");
      setSuccessModal({
        title: "Competidor actualizado",
        message: `${editingMemberForm.nombre} se actualizó correctamente.`,
      });
      setEditingMemberId(null);
      setEditingMemberForm({ nombre: "", github_username: "" });
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo actualizar el competidor.");
    } finally {
      setIsSubmittingMemberEdit(false);
    }
  }

  async function handleCreateParticipant(event: { preventDefault(): void }) {
    event.preventDefault();
    setIsSubmittingStudent(true);
    setFeedback("Registrando participante...");

    try {
      if (!accessToken) {
        setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
        return;
      }
      if (!studentForm.grupo_id) {
        setFeedback("Selecciona un proyecto para el participante.");
        return;
      }

      const participant = await apiPost<ParticipantQuickResult>(
        "/participantes/registro-rapido",
        {
          nombre: studentForm.nombre.trim(),
          grupo_id: Number(studentForm.grupo_id),
          github_username: studentForm.github_username.trim() || null,
        },
        accessToken,
      );
      setFeedback(`Participante ${participant.nombre} registrado y agregado al grupo.`);
      setSuccessModal({
        title: "Participante registrado",
        message: `${participant.nombre} se agrego al grupo seleccionado.`,
      });
      setStudentForm(initialStudentForm);
      setActiveModal(null);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo registrar el participante.");
    } finally {
      setIsSubmittingStudent(false);
    }
  }

  async function handleSearchDocentes() {
    if (!accessToken) {
      setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
      return;
    }

    const query = shareQuery.trim();
    if (query.length < 2) {
      setFeedback("Escribe al menos 2 caracteres para buscar docentes.");
      return;
    }

    setIsSearchingTargets(true);
    try {
      const docentes = await apiGet<TeacherShareTarget[]>(`/proyectos/docentes/buscar?q=${encodeURIComponent(query)}`, accessToken);
      setShareTargets(docentes);
      setSelectedShareTarget(null);
      if (docentes.length === 0) {
        setFeedback("No se encontraron docentes con ese criterio.");
      }
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudieron buscar docentes.");
    } finally {
      setIsSearchingTargets(false);
    }
  }

  async function handleShareGroup() {
    if (!accessToken) {
      setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
      return;
    }
    if (!shareModal) {
      return;
    }
    if (!selectedShareTarget) {
      setFeedback("Selecciona el docente destinatario.");
      return;
    }

    setIsSubmittingShare(true);
    setFeedback(`Compartiendo ${shareModal.groupName}...`);

    try {
      const result = await apiPost<GroupInviteCreatedResponse>(
        `/proyectos/${shareModal.groupId}/compartir`,
        { docente_id: selectedShareTarget.id },
        accessToken,
      );

      setSuccessModal({
        title: "Invitacion enviada",
        message: `Se envio invitacion a @${result.target_docente_username}. Le aparecera en sus notificaciones.`,
      });
      setShareModal(null);
      setShareQuery("");
      setShareTargets([]);
      setSelectedShareTarget(null);
      setFeedback("Invitacion enviada correctamente.");
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo compartir el grupo.");
    } finally {
      setIsSubmittingShare(false);
    }
  }

  async function handleGenerateShareLink() {
    if (!accessToken || !shareModal) {
      setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
      return;
    }

    setIsGeneratingShareLink(true);
    try {
      const result = await apiPost<GroupShareLinkResponse>(`/proyectos/${shareModal.groupId}/compartir/link`, {}, accessToken);
      const appOrigin = typeof window !== "undefined" ? window.location.origin : "";
      const link = `${appOrigin}${result.invite_link}`;
      setGeneratedShareLink(link);
      setFeedback(`Link generado. Expira en ${result.expires_in_minutes} minutos.`);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo generar el link.");
    } finally {
      setIsGeneratingShareLink(false);
    }
  }

  async function handleCopyShareLink() {
    if (!generatedShareLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(generatedShareLink);
      setFeedback("Link copiado al portapapeles.");
    } catch {
      setFeedback("No se pudo copiar el link automaticamente.");
    }
  }

  async function handleAcceptShareByLink() {
    if (!accessToken) {
      setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
      return;
    }

    const raw = acceptShareToken.trim();
    if (!raw) {
      setFeedback("Pega el link o codigo de invitacion.");
      return;
    }

    let inviteCode = raw;
    if (raw.includes("invite=")) {
      try {
        const parsed = new URL(raw);
        inviteCode = parsed.searchParams.get("invite") || "";
      } catch {
        inviteCode = raw;
      }
    }

    if (!inviteCode) {
      setFeedback("No se encontro codigo valido en el link.");
      return;
    }

    setIsAcceptingShare(true);
    try {
      const result = await apiPost<GroupShareResponse>(`/proyectos/invitaciones/${encodeURIComponent(inviteCode)}/aceptar`, {}, accessToken);
      const updatedGroups = await apiGet<Group[]>("/proyectos", accessToken);
      const updatedInvites = await apiGet<GroupInviteNotification[]>("/proyectos/invitaciones/mias", accessToken);
      setGroups(updatedGroups);
      setInviteNotifications(updatedInvites);
      setAcceptShareToken("");
      setSuccessModal({
        title: "Proyecto recibido",
        message: `Recibiste una copia del proyecto con ${result.copied_students} alumnos.`,
      });
      setFeedback("Proyecto recibido correctamente desde link.");
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo aceptar el link.");
    } finally {
      setIsAcceptingShare(false);
    }
  }

  async function handleAcceptNotificationInvite(inviteCode: string) {
    if (!accessToken) {
      setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
      return;
    }

    setIsAcceptingShare(true);
    try {
      const result = await apiPost<GroupShareResponse>(`/proyectos/invitaciones/${encodeURIComponent(inviteCode)}/aceptar`, {}, accessToken);
      const updatedGroups = await apiGet<Group[]>("/proyectos", accessToken);
      const updatedInvites = await apiGet<GroupInviteNotification[]>("/proyectos/invitaciones/mias", accessToken);
      setGroups(updatedGroups);
      setInviteNotifications(updatedInvites);
      setSuccessModal({
        title: "Invitacion aceptada",
        message: `Se copio el proyecto con ${result.copied_students} alumnos.`,
      });
      setFeedback("Invitacion aceptada correctamente.");
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo aceptar la invitacion.");
    } finally {
      setIsAcceptingShare(false);
    }
  }

  async function loadGroupMembersContext(groupId: number, token: string) {
    const [members, candidates] = await Promise.all([
      apiGet<GroupStudent[]>(`/proyectos/${groupId}/alumnos`, token),
      apiGet<GroupStudentCandidate[]>(`/proyectos/${groupId}/alumnos/disponibles`, token),
    ]);
    setGroupMembers(members);
    setCandidateStudents(candidates);
    setSelectedCandidateParticipantId("");
  }

  async function openMembersModal(group: Group) {
    if (!accessToken) {
      setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
      return;
    }

    setMembersModal({ groupId: group.id, groupName: group.nombre });
    setIsLoadingMembers(true);
    try {
      await loadGroupMembersContext(group.id, accessToken);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudieron cargar los alumnos del proyecto.");
      setMembersModal(null);
    } finally {
      setIsLoadingMembers(false);
    }
  }

  async function handleAddStudentToGroup() {
    if (!accessToken) {
      setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
      return;
    }
    if (!membersModal) {
      return;
    }
    if (!selectedCandidateParticipantId) {
      setFeedback("Selecciona un alumno para agregar.");
      return;
    }

    setIsSubmittingMemberChange(true);
    try {
      await apiPost<GroupStudent>(
        `/proyectos/${membersModal.groupId}/alumnos`,
        { participant_id: Number(selectedCandidateParticipantId) },
        accessToken,
      );
      await loadGroupMembersContext(membersModal.groupId, accessToken);
      setFeedback("Alumno agregado al grupo.");
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo agregar el alumno.");
    } finally {
      setIsSubmittingMemberChange(false);
    }
  }

  async function handleRemoveStudentFromGroup(participantId: number, memberName: string) {
    setRemoveConfirmModal({ participantId, nombre: memberName });
  }

  async function handleConfirmRemoveStudent() {
    if (!accessToken || !membersModal || !removeConfirmModal) {
      setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
      return;
    }

    setIsRemovingMember(true);
    try {
      await apiDelete<{ message: string }>(`/proyectos/${membersModal.groupId}/alumnos/participantes/${removeConfirmModal.participantId}`, accessToken);
      await loadGroupMembersContext(membersModal.groupId, accessToken);
      setFeedback("Competidor removido del proyecto.");
      setRemoveConfirmModal(null);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo remover el competidor.");
    } finally {
      setIsRemovingMember(false);
    }
  }

  async function loadMemberCommits(usuarioId: number, token: string) {
    const response = await apiGet<CommitListResponse>(`/commits/${usuarioId}?limit=200`, token);
    setMemberCommits(response.items);
  }

  async function openMemberCommitsModal(member: GroupStudent) {
    if (!accessToken) {
      setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
      return;
    }

    setMemberCommitsModal({
      usuarioId: member.usuario_id,
      nombre: member.nombre,
      username: member.username,
    });
    setIsLoadingMemberCommits(true);
    try {
      await loadMemberCommits(member.usuario_id, accessToken);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudieron cargar los commits.");
      setMemberCommitsModal(null);
    } finally {
      setIsLoadingMemberCommits(false);
    }
  }

  async function handleSyncMemberCommits() {
    if (!accessToken || !memberCommitsModal) {
      setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
      return;
    }

    setIsSyncingMemberCommits(true);
    try {
      const result = await apiPost<GithubSyncResponse>(`/github/sync/${memberCommitsModal.usuarioId}?days=365`, {}, accessToken);
      await loadMemberCommits(memberCommitsModal.usuarioId, accessToken);
      setFeedback(`Sync completado: ${result.commits_nuevos} commits nuevos.`);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo sincronizar GitHub.");
    } finally {
      setIsSyncingMemberCommits(false);
    }
  }

  async function loadGroupRanking(groupId: number, token: string) {
    const items = await apiGet<GroupRankingItem[]>(`/ranking/proyecto/${groupId}`, token);
    setRankingItems(items);
  }

  async function openRankingModal(group: Group) {
    if (!accessToken) {
      setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
      return;
    }

    setRankingModal({ groupId: group.id, groupName: group.nombre });
    setIsLoadingRanking(true);
    try {
      await loadGroupRanking(group.id, accessToken);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo cargar el ranking del proyecto.");
      setRankingModal(null);
    } finally {
      setIsLoadingRanking(false);
    }
  }

  async function togglePeerVoting(group: Group) {
    setCardMenuGroupId(null);
    if (!accessToken) return;
    try {
      const result = await apiPatch<{ proyecto_id: number; peer_voting_enabled: boolean }>(
        `/proyectos/${group.id}/peer-voting`,
        {},
        accessToken,
      );
      setGroups((current) =>
        current.map((g) => (g.id === result.proyecto_id ? { ...g, peer_voting_enabled: result.peer_voting_enabled } : g)),
      );
      setFeedback(`Votaciones ${result.peer_voting_enabled ? "activadas" : "desactivadas"} para ${group.nombre}`);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo cambiar el estado de votaciones.");
    }
  }

  async function handleRefreshRankingWithSync() {
    if (!accessToken || !rankingModal) {
      setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
      return;
    }

    setIsRefreshingRanking(true);
    setSyncProgress(null);
    try {
      type SyncTarget = { usuarioId: number; nombre: string; githubUsername: string | null | undefined };
      let targets: SyncTarget[] = rankingItems
        .filter((item) => item.usuario_id > 0)
        .map((item) => ({ usuarioId: item.usuario_id, nombre: item.nombre, githubUsername: item.github_username }));

      if (targets.length === 0) {
        const members = await apiGet<GroupStudent[]>(`/proyectos/${rankingModal.groupId}/alumnos`, accessToken);
        targets = members.map((m) => ({ usuarioId: m.usuario_id, nombre: m.nombre, githubUsername: m.github_username }));
      }

      const total = targets.length;
      let syncedMembers = 0;
      let totalNewCommits = 0;

      for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        setSyncProgress({ current: i + 1, total, currentName: target.githubUsername ? `@${target.githubUsername}` : target.nombre });
        try {
          const result = await apiPost<GithubSyncResponse>(`/github/sync/${target.usuarioId}?days=3650`, {}, accessToken);
          syncedMembers += 1;
          totalNewCommits += result.commits_nuevos;
          setRankingItems((prev) =>
            prev.map((item) =>
              item.usuario_id === target.usuarioId
                ? { ...item, commits_count: item.commits_count + result.commits_nuevos }
                : item,
            ),
          );
        } catch {
          // Skip users without GitHub username or with GitHub API errors.
        }
      }

      setSyncProgress(null);
      await loadGroupRanking(rankingModal.groupId, accessToken);
      setFeedback(`Refrescado: ${syncedMembers} alumnos sincronizados, ${totalNewCommits} commits nuevos.`);
    } catch (error) {
      setSyncProgress(null);
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo refrescar el ranking.");
    } finally {
      setIsRefreshingRanking(false);
    }
  }

  function openShareModal(group: Group) {
    setShareModal({ groupId: group.id, groupName: group.nombre });
    setShareQuery("");
    setShareTargets([]);
    setSelectedShareTarget(null);
    setGeneratedShareLink("");
  }


  function handleLogout() {
    clearAuthSession();
    window.location.href = "/login";
  }

  const docenteHeaderActions = (
    <>

      <button
        type="button"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-[color:var(--accent)]/35 hover:bg-white/10"
        onClick={() => setIsNotificationsOpen(true)}
        aria-label="Notificaciones"
        title="Notificaciones"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M9.5 17a2.5 2.5 0 0 0 5 0" />
        </svg>
        {inviteNotifications.length > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[color:var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-slate-950">
            {inviteNotifications.length}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        className="rounded-sm bg-[color:var(--accent)] px-5 py-3 font-serif text-sm font-semibold text-[#1a1a16] transition hover:bg-[color:var(--accent-strong)]"
        onClick={() => openGroupCreateModal()}
      >
        Nuevo proyecto
      </button>
      <button
        type="button"
        className="rounded-sm border border-red-400/20 bg-red-500/10 px-5 py-3 font-serif text-sm font-semibold text-red-100 transition hover:border-red-300/40 hover:bg-red-500/20"
        onClick={handleLogout}
      >
        Salir
      </button>
    </>
  );

  return (
    <DashboardShell title="Panel Docente" headerActions={docenteHeaderActions}>
      {!isHydrated ? (
        <section className="glass-panel rounded-[1.5rem] p-5">
          <p className="text-sm text-[color:var(--muted)]">Cargando panel...</p>
        </section>
      ) : (
      <section className="glass-panel rounded-[1.5rem] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-serif text-2xl font-semibold text-[color:var(--foreground)]">Mis proyectos</h3>
          <p className="text-sm text-[color:var(--muted)]">Total: {filteredGroups.length}</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[1.4fr_0.9fr_0.8fr]">
          <input
            className="rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
            placeholder="Buscar proyecto o carrera"
            value={groupSearch}
            onChange={(event) => setGroupSearch(event.target.value)}
          />
          <select
            className="rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-[color:var(--accent)]/40"
            value={filterCarrera}
            onChange={(event) => setFilterCarrera(event.target.value)}
          >
            <option value="all" className="bg-[#1a1a16] text-white">Todas las carreras</option>
            {availableCarreras.map((carrera) => (
              <option key={carrera} value={carrera} className="bg-[#1a1a16] text-white">
                {carrera}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-[color:var(--accent)]/40"
            value={groupsViewMode}
            onChange={(event) => setGroupsViewMode(event.target.value as "cards" | "list")}
          >
            <option value="cards" className="bg-[#1a1a16] text-white">Tarjeta</option>
            <option value="list" className="bg-[#1a1a16] text-white">Lista</option>
          </select>
        </div>
        {feedback ? (
          <p className="mt-3 text-sm text-[color:var(--accent)]">{feedback}</p>
        ) : null}

        {isLoadingGroups ? (
          <p className="mt-4 text-sm text-[color:var(--muted)]">Cargando tus proyectos...</p>
        ) : !accessToken ? (
          <p className="mt-4 text-sm text-[color:var(--muted)]">Inicia sesion para consultar tus proyectos.</p>
        ) : filteredGroups.length === 0 ? (
          <p className="mt-4 text-sm text-[color:var(--muted)]">Aun no has creado proyectos.</p>
        ) : groupsViewMode === "cards" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredGroups.map((group, index) => (
              <article
                key={group.id}
                className="relative cursor-pointer overflow-visible rounded-2xl border border-white/10 bg-white/5 transition hover:border-[color:var(--accent)]/35"
                onClick={() => void openRankingModal(group)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    void openRankingModal(group);
                  }
                }}
                aria-label={`Abrir ranking del grupo ${group.nombre}`}
              >
                <div
                  className="h-20 w-full rounded-t-2xl"
                  style={{
                    background:
                      index % 3 === 0
                        ? "linear-gradient(120deg, #6366f1, #4f46e5)"
                        : index % 3 === 1
                          ? "linear-gradient(120deg, #22d3ee, #0ea5e9)"
                          : "linear-gradient(120deg, #34d399, #10b981)",
                  }}
                />
                <div className="p-4">
                  <h4 className="text-base font-semibold text-[color:var(--foreground)]">{group.nombre}</h4>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {group.carrera} - Semestre {group.semestre}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="text-xs text-[color:var(--muted)]">Abrir ranking</span>
                    <div className="relative">
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-[color:var(--accent)]/50 hover:bg-white/10"
                        onClick={(event) => {
                          event.stopPropagation();
                          setCardMenuGroupId((current) => (current === group.id ? null : group.id));
                        }}
                        aria-label="Opciones"
                        title="Opciones"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>

                      {cardMenuGroupId === group.id ? (
                        <div className="absolute bottom-10 right-0 z-30 w-44 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a16]/95 shadow-xl backdrop-blur">
                          <button
                            type="button"
                            className="block w-full px-4 py-2 text-left text-sm text-white transition hover:bg-white/10"
                            onClick={(event) => {
                              event.stopPropagation();
                              openGroupEditModal(group);
                            }}
                          >
                            Modificar grupo
                          </button>
                          <button
                            type="button"
                            className="block w-full px-4 py-2 text-left text-sm text-white transition hover:bg-white/10"
                            onClick={(event) => {
                              event.stopPropagation();
                              setCardMenuGroupId(null);
                              void openMembersModal(group);
                            }}
                          >
                            Agregar competidores
                          </button>
                          <button
                            type="button"
                            className="block w-full px-4 py-2 text-left text-sm text-white transition hover:bg-white/10"
                            onClick={(event) => {
                              event.stopPropagation();
                              setCardMenuGroupId(null);
                              openShareModal(group);
                            }}
                          >
                            Compartir proyecto
                          </button>
                          <button
                            type="button"
                            className="block w-full px-4 py-2 text-left text-sm text-[color:var(--accent)] transition hover:bg-white/10"
                            onClick={(event) => {
                              event.stopPropagation();
                              void openStudentInviteModal(group);
                            }}
                          >
                            Invitar alumnos
                          </button>
                          <button
                            type="button"
                            className="block w-full px-4 py-2 text-left text-sm text-white transition hover:bg-white/10"
                            onClick={(event) => {
                              event.stopPropagation();
                              void togglePeerVoting(group);
                            }}
                          >
                            {group.peer_voting_enabled ? "Desactivar votaciones ★" : "Activar votaciones ★"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[color:var(--muted)]">
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Grupo</th>
                  <th className="px-4 py-3 font-medium">Carrera</th>
                  <th className="px-4 py-3 font-medium">Semestre</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="border-b border-white/5 text-white/95 last:border-b-0">
                    <td className="px-4 py-3">{group.id}</td>
                    <td className="px-4 py-3">{group.nombre}</td>
                    <td className="px-4 py-3">{group.carrera}</td>
                    <td className="px-4 py-3">{group.semestre}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        className="mr-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[color:var(--accent)]/50 hover:bg-white/10"
                        onClick={() => void openMembersModal(group)}
                      >
                        Alumnos
                      </button>
                      <button
                        type="button"
                        className="mr-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[color:var(--accent)]/50 hover:bg-white/10"
                        onClick={() => void openRankingModal(group)}
                      >
                        Ranking
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[color:var(--accent)]/50 hover:bg-white/10"
                        onClick={() => openShareModal(group)}
                      >
                        Compartir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center">
          <button
            type="button"
            className="flex items-center gap-3 rounded-sm border border-white/10 bg-white/5 px-8 py-4 font-serif text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent)]/35 hover:bg-white/10"
            onClick={() => setIsGeneralRankingModalOpen(true)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 text-[color:var(--accent)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            Ranking general de tus proyectos
          </button>
        </div>
      </section>
      )}

      {activeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#16160f]/80 px-4">
          <div className="glass-panel w-full max-w-xl rounded-[1.8rem] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">
                  {activeModal === "group" ? (editingGroup ? "Modificar proyecto" : "Nuevo proyecto") : "Nuevo participante"}
                </p>
                <h3 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-[color:var(--foreground)]">
                  {activeModal === "group" ? (editingGroup ? "Editar proyecto" : "Crear proyecto") : "Agregar participante"}
                </h3>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-[color:var(--muted)] transition hover:border-white/20 hover:text-white"
                onClick={() => {
                  setActiveModal(null);
                  setEditingGroup(null);
                  setGroupForm(initialGroupForm);
                }}
              >
                Cerrar
              </button>
            </div>

            {activeModal === "group" ? (
              <div className="mt-6 space-y-5">
                {!editingGroup ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">Aceptar invitacion</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                      <input
                        className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
                        placeholder="Pega link o codigo"
                        value={acceptShareToken}
                        onChange={(event) => setAcceptShareToken(event.target.value)}
                      />
                      <button
                        type="button"
                        className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-[color:var(--accent)]/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => void handleAcceptShareByLink()}
                        disabled={isAcceptingShare}
                      >
                        {isAcceptingShare ? "Aceptando..." : "Aceptar link"}
                      </button>
                    </div>
                  </div>
                ) : null}

                <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmitGroup}>
                  <input
                    className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40 sm:col-span-2"
                    placeholder="Nombre del proyecto"
                    value={groupForm.nombre}
                    onChange={(event) => setGroupForm((current) => ({ ...current, nombre: event.target.value }))}
                    required
                  />
                  <input
                    className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40 sm:col-span-2"
                    placeholder="Carrera"
                    value={groupForm.carrera}
                    onChange={(event) => setGroupForm((current) => ({ ...current, carrera: event.target.value }))}
                    required
                  />
                  <div className="flex flex-col gap-1">
                    <label className="px-1 text-xs text-[color:var(--muted)]">Inicio del proyecto</label>
                    <input
                      className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none focus:border-[color:var(--accent)]/40"
                      type="datetime-local"
                      value={groupForm.fecha_inicio}
                      onChange={(event) => setGroupForm((current) => ({ ...current, fecha_inicio: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="px-1 text-xs text-[color:var(--muted)]">Cierre del proyecto</label>
                    <input
                      className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none focus:border-[color:var(--accent)]/40"
                      type="datetime-local"
                      value={groupForm.fecha_cierre}
                      onChange={(event) => setGroupForm((current) => ({ ...current, fecha_cierre: event.target.value }))}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingGroup}
                    className="sm:col-span-2 rounded-full bg-[color:var(--accent)] px-5 py-3 font-semibold text-slate-950 transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmittingGroup ? "Guardando..." : editingGroup ? "Actualizar proyecto" : "Crear proyecto"}
                  </button>
                </form>
              </div>
            ) : (
              <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleCreateParticipant}>
                <input
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40 sm:col-span-2"
                  placeholder="Nombre completo"
                  value={studentForm.nombre}
                  onChange={(event) => setStudentForm((current) => ({ ...current, nombre: event.target.value }))}
                  required
                />
                <select
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none focus:border-[color:var(--accent)]/40 sm:col-span-2"
                  value={studentForm.grupo_id}
                  onChange={(event) => setStudentForm((current) => ({ ...current, grupo_id: event.target.value }))}
                  required
                >
                  <option value="" className="bg-[#1a1a16] text-slate-300">
                    Selecciona un proyecto
                  </option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id} className="bg-[#1a1a16] text-white">
                      {group.nombre}
                    </option>
                  ))}
                </select>
                <input
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40 sm:col-span-2"
                  placeholder="GitHub username (opcional)"
                  value={studentForm.github_username}
                  onChange={(event) => setStudentForm((current) => ({ ...current, github_username: event.target.value }))}
                />
                <button
                  type="submit"
                  disabled={isSubmittingStudent}
                  className="sm:col-span-2 rounded-full bg-[color:var(--accent)] px-5 py-3 font-semibold text-slate-950 transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmittingStudent ? "Guardando participante..." : "Guardar participante"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {successModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#16160f]/80 px-4">
          <div className="glass-panel w-full max-w-md rounded-[1.8rem] p-7">
            <h3 className="mt-3 font-serif text-2xl sm:text-3xl font-semibold text-[color:var(--foreground)]">{successModal.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{successModal.message}</p>
            <button
              type="button"
              className="mt-6 w-full rounded-full bg-[color:var(--accent)] px-5 py-3 font-semibold text-slate-950 transition hover:bg-[color:var(--accent-strong)]"
              onClick={() => setSuccessModal(null)}
            >
              Entendido
            </button>
          </div>
        </div>
      ) : null}

      {shareModal ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#16160f]/80 px-4">
          <div className="glass-panel w-full max-w-xl rounded-[1.8rem] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">Compartir proyecto</p>
                <h3 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-[color:var(--foreground)]">{shareModal.groupName}</h3>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-[color:var(--muted)] transition hover:border-white/20 hover:text-white"
                onClick={() => setShareModal(null)}
                disabled={isSubmittingShare}
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
                placeholder="Busca docente por username o nombre"
                value={shareQuery}
                onChange={(event) => setShareQuery(event.target.value)}
              />
              <button
                type="button"
                className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-[color:var(--accent)]/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void handleSearchDocentes()}
                disabled={isSearchingTargets || isSubmittingShare}
              >
                {isSearchingTargets ? "Buscando..." : "Buscar"}
              </button>
            </div>

            <div className="mt-4 max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-3">
              {shareTargets.length === 0 ? (
                <p className="text-sm text-[color:var(--muted)]">Sin resultados por ahora.</p>
              ) : (
                shareTargets.map((target) => {
                  const isSelected = selectedShareTarget?.id === target.id;
                  return (
                    <button
                      key={target.id}
                      type="button"
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-[color:var(--accent)]/60 bg-[color:var(--accent)]/15 text-white"
                          : "border-white/10 bg-white/5 text-white/90 hover:border-white/20"
                      }`}
                      onClick={() => setSelectedShareTarget(target)}
                    >
                      <p className="text-sm font-semibold">{target.nombre}</p>
                      <p className="text-xs text-[color:var(--muted)]">@{target.username}</p>
                    </button>
                  );
                })
              )}
            </div>

            <button
              type="button"
              className="mt-5 w-full rounded-full bg-[color:var(--accent)] px-5 py-3 font-semibold text-slate-950 transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
              onClick={() => void handleShareGroup()}
              disabled={!selectedShareTarget || isSubmittingShare}
            >
              {isSubmittingShare ? "Compartiendo..." : "Compartir proyecto"}
            </button>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-white">Link</p>
                <button
                  type="button"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-[color:var(--accent)]/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => void handleGenerateShareLink()}
                  disabled={isGeneratingShareLink || isSubmittingShare}
                >
                  {isGeneratingShareLink ? "Generando..." : "Generar link"}
                </button>
              </div>
              {generatedShareLink ? (
                <>
                  <input
                    className="mt-3 w-full rounded-xl border border-white/10 bg-[#16160f]/40 px-3 py-2 text-xs text-white/90"
                    value={generatedShareLink}
                    readOnly
                  />
                  <button
                    type="button"
                    className="mt-3 rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-[color:var(--accent-strong)]"
                    onClick={() => void handleCopyShareLink()}
                  >
                    Copiar link
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {membersModal ? (
        <div className="fixed inset-0 z-[71] flex items-center justify-center bg-[#16160f]/80 px-4 py-6">
          <div className="glass-panel flex max-h-[90vh] w-full max-w-4xl flex-col rounded-[1.8rem] p-7">
            <div className="flex shrink-0 items-start justify-between gap-4">
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[color:var(--foreground)]">{membersModal.groupName}</h3>
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-[color:var(--muted)] transition hover:border-white/20 hover:text-white"
                onClick={() => setMembersModal(null)}
              >
                Cerrar
              </button>
            </div>

            {isLoadingMembers ? (
              <p className="mt-5 text-sm text-[color:var(--muted)]">Cargando...</p>
            ) : (
              <>
                {!isCreatingNewCompetitor ? (
                  <div className="mt-5 shrink-0 space-y-3">
                    <input
                      type="text"
                      className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
                      placeholder="Busca competidor por nombre o username..."
                      value={competitorSearch}
                      onChange={(event) => setCompetitorSearch(event.target.value)}
                    />
                    
                    {candidateStudents.length > 0 && competitorSearch.trim() !== "" && (
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-2">
                        {candidateStudents
                          .filter((candidate) => 
                            candidate.nombre.toLowerCase().includes(competitorSearch.toLowerCase()) ||
                            candidate.username.toLowerCase().includes(competitorSearch.toLowerCase())
                          )
                          .map((candidate) => (
                            <button
                              key={candidate.participant_id}
                              type="button"
                              className="w-full text-left rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white transition hover:border-[color:var(--accent)]/35 hover:bg-white/10 mb-2 last:mb-0"
                              onClick={() => {
                                setSelectedCandidateParticipantId(candidate.participant_id.toString());
                                setCompetitorSearch("");
                              }}
                            >
                              <p className="font-semibold">{candidate.nombre}</p>
                              <p className="text-xs text-[color:var(--muted)]">@{candidate.username}</p>
                            </button>
                          ))}
                      </div>
                    )}

                    {selectedCandidateParticipantId && (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs text-[color:var(--muted)] mb-2">Seleccionado:</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">
                              {candidateStudents.find(c => c.participant_id.toString() === selectedCandidateParticipantId)?.nombre}
                            </p>
                            <p className="text-xs text-[color:var(--muted)]">
                              @{candidateStudents.find(c => c.participant_id.toString() === selectedCandidateParticipantId)?.username}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="rounded-sm bg-[color:var(--accent)] px-4 py-2 font-serif text-sm font-semibold text-[#1a1a16] transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                            onClick={() => void handleAddStudentToGroup()}
                            disabled={isSubmittingMemberChange}
                          >
                            Agregar
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="w-full rounded-sm border border-white/10 bg-white/5 px-5 py-3 font-serif text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent)]/35 hover:bg-white/10"
                      onClick={() => {
                        setIsCreatingNewCompetitor(true);
                        setCompetitorSearch("");
                        setSelectedCandidateParticipantId("");
                      }}
                    >
                      Crear nuevo competidor
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateCompetitorInModal} className="mt-5 shrink-0 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--accent)]">Nombre del competidor</label>
                      <input
                        type="text"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
                        placeholder="Ej: Juan Pérez"
                        value={newCompetitorForm.nombre}
                        onChange={(event) => setNewCompetitorForm(prev => ({ ...prev, nombre: event.target.value }))}
                        disabled={isSubmittingNewCompetitor}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--accent)]">GitHub username (opcional)</label>
                      <input
                        type="text"
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
                        placeholder="Ej: juan-perez"
                        value={newCompetitorForm.github_username}
                        onChange={(event) => setNewCompetitorForm(prev => ({ ...prev, github_username: event.target.value }))}
                        disabled={isSubmittingNewCompetitor}
                      />
                    </div>
                    <p className="text-xs text-[color:var(--muted)]">El username se generará automáticamente de forma aleatoria.</p>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 rounded-sm bg-[color:var(--accent)] px-4 py-3 font-serif text-sm font-semibold text-[#1a1a16] transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={isSubmittingNewCompetitor}
                      >
                        {isSubmittingNewCompetitor ? "Creando..." : "Crear competidor"}
                      </button>
                      <button
                        type="button"
                        className="flex-1 rounded-sm border border-white/10 bg-white/5 px-4 py-3 font-serif text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent)]/35 hover:bg-white/10"
                        onClick={() => {
                          setIsCreatingNewCompetitor(false);
                          setNewCompetitorForm({ nombre: "", github_username: "" });
                        }}
                        disabled={isSubmittingNewCompetitor}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-5 min-h-0 flex-1 overflow-auto rounded-2xl border border-white/10 bg-white/5 relative">
                  {groupMembers.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-[color:var(--muted)]">Este proyecto no tiene alumnos.</p>
                  ) : (
                    <table className="min-w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-[#141a2a]/95 backdrop-blur">
                        <tr className="border-b border-white/10 text-[color:var(--muted)]">
                          <th className="px-4 py-3 font-medium">Alumno</th>
                          <th className="px-4 py-3 font-medium">Username</th>
                          <th className="px-4 py-3 font-medium hidden sm:table-cell">GitHub</th>
                          <th className="px-4 py-3 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupMembers.map((member) => (
                          <tr key={member.participant_id} className="border-b border-white/5 text-white/95 last:border-b-0">
                            <td className="px-4 py-3">{member.nombre}</td>
                            <td className="px-4 py-3">@{member.username}</td>
                            <td className="px-4 py-3 hidden sm:table-cell">{member.github_username ? `@${member.github_username}` : "-"}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col items-end justify-end gap-2 sm:flex-row sm:items-center">
                                <button
                                  type="button"
                                  className="w-full whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[color:var(--accent)]/50 hover:bg-white/10 sm:w-auto"
                                  onClick={() => {
                                    setEditingMemberId(member.participant_id);
                                    setEditingMemberForm({ nombre: member.nombre, github_username: member.github_username || "" });
                                  }}
                                >
                                  Modificar
                                </button>
                                <button
                                  type="button"
                                  className="w-full whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[color:var(--accent)]/50 hover:bg-white/10 sm:w-auto"
                                  onClick={() => void openMemberCommitsModal(member)}
                                >
                                  Commits
                                </button>
                                <button
                                  type="button"
                                  className="w-full whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-red-300/50 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                                  onClick={() => handleRemoveStudentFromGroup(member.participant_id, member.nombre)}
                                  disabled={isRemovingMember}
                                >
                                  Quitar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      ) : null}

      {editingMemberId !== null && (
        <div className="fixed inset-0 z-[72] flex items-center justify-center bg-[#16160f]/80 px-4 py-6">
          <div className="glass-panel w-full max-w-md rounded-[1.8rem] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">Modificar competidor</p>
                <h3 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-[color:var(--foreground)]">Editar datos</h3>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-[color:var(--muted)] transition hover:border-white/20 hover:text-white"
                onClick={() => {
                  setEditingMemberId(null);
                  setEditingMemberForm({ nombre: "", github_username: "" });
                }}
                disabled={isSubmittingMemberEdit}
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--accent)]">Nombre</label>
                <input
                  type="text"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
                  value={editingMemberForm.nombre}
                  onChange={(event) => setEditingMemberForm(prev => ({ ...prev, nombre: event.target.value }))}
                  disabled={isSubmittingMemberEdit}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[color:var(--accent)]">GitHub username (opcional)</label>
                <input
                  type="text"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
                  placeholder="Ej: juan-perez"
                  value={editingMemberForm.github_username}
                  onChange={(event) => setEditingMemberForm(prev => ({ ...prev, github_username: event.target.value }))}
                  disabled={isSubmittingMemberEdit}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  className="flex-1 rounded-sm bg-[color:var(--accent)] px-4 py-3 font-serif text-sm font-semibold text-[#1a1a16] transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={() => void handleUpdateMember()}
                  disabled={isSubmittingMemberEdit}
                >
                  {isSubmittingMemberEdit ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-sm border border-white/10 bg-white/5 px-4 py-3 font-serif text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent)]/35 hover:bg-white/10"
                  onClick={() => {
                    setEditingMemberId(null);
                    setEditingMemberForm({ nombre: "", github_username: "" });
                  }}
                  disabled={isSubmittingMemberEdit}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {removeConfirmModal ? (
        <div className="fixed inset-0 z-[99] flex items-center justify-center bg-[#16160f]/80 px-4">
          <div className="glass-panel w-full max-w-md rounded-[1.8rem] p-7">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-red-400">Confirmar eliminación</p>
                <h3 className="mt-2 font-serif text-2xl sm:text-3xl font-semibold text-[color:var(--foreground)]">¿Quitar competidor?</h3>
              </div>
            </div>

            <p className="mt-4 text-sm text-[color:var(--muted)]">
              ¿Estás seguro de que deseas quitar a <span className="font-semibold text-white">{removeConfirmModal.nombre}</span> de este proyecto? Esta acción no se puede deshacer.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-sm border border-white/10 bg-white/5 px-4 py-3 font-serif text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent)]/35 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={() => setRemoveConfirmModal(null)}
                disabled={isRemovingMember}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="flex-1 rounded-sm border border-red-400/20 bg-red-500/10 px-4 py-3 font-serif text-sm font-semibold text-red-100 transition hover:border-red-300/40 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                onClick={() => void handleConfirmRemoveStudent()}
                disabled={isRemovingMember}
              >
                {isRemovingMember ? "Eliminando..." : "Quitar competidor"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {memberCommitsModal ? (
        <div className="fixed inset-0 z-[73] flex items-center justify-center bg-[#16160f]/80 px-4 py-6">
          <div className="glass-panel flex max-h-[90vh] w-full max-w-4xl flex-col rounded-[1.8rem] p-7">
            <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[color:var(--foreground)]">{memberCommitsModal.nombre}</h3>
                <p className="text-sm text-[color:var(--muted)]">@{memberCommitsModal.username}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={() => void handleSyncMemberCommits()}
                  disabled={isSyncingMemberCommits}
                >
                  {isSyncingMemberCommits ? "Sincronizando..." : "Sync GitHub"}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/10 px-3 py-1 text-sm text-[color:var(--muted)] transition hover:border-white/20 hover:text-white"
                  onClick={() => setMemberCommitsModal(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>

            {isLoadingMemberCommits ? (
              <p className="mt-5 text-sm text-[color:var(--muted)]">Cargando commits...</p>
            ) : memberCommits.length === 0 ? (
              <p className="mt-5 text-sm text-[color:var(--muted)]">Sin commits sincronizados.</p>
            ) : (
              <div className="mt-5 min-h-0 flex-1 overflow-auto rounded-2xl border border-white/10 bg-white/5 relative">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-[#141a2a]/95 backdrop-blur">
                    <tr className="border-b border-white/10 text-[color:var(--muted)]">
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Repo</th>
                      <th className="px-4 py-3 font-medium">Mensaje</th>
                      <th className="px-4 py-3 font-medium">SHA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberCommits.map((commit) => (
                      <tr key={commit.sha} className="border-b border-white/5 text-white/95 last:border-b-0">
                        <td className="px-4 py-3">{new Date(commit.fecha).toLocaleDateString()}</td>
                        <td className="px-4 py-3">{commit.owner}/{commit.repo}</td>
                        <td className="px-4 py-3">{commit.mensaje}</td>
                        <td className="px-4 py-3">
                          <a className="text-[color:var(--accent)] hover:underline" href={commit.url} target="_blank" rel="noreferrer">
                            {commit.sha.slice(0, 7)}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {rankingModal ? (
        <div className="fixed inset-0 z-[74] flex items-center justify-center bg-[#16160f]/80 px-4 py-6">
          <div className="glass-panel flex max-h-[90vh] w-full max-w-6xl flex-col rounded-[1.8rem] p-7">
            <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[color:var(--foreground)]">Ranking - {rankingModal.groupName}</h3>
                <p className="text-sm text-[color:var(--muted)]">Escala 0-100 por criterio. Puntos por commits usan regla de 3 con maximo del proyecto.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-[color:var(--accent)]/50 hover:bg-white/10 disabled:opacity-50"
                  onClick={() => void handleRefreshRankingWithSync()}
                  disabled={isLoadingRanking || isRefreshingRanking}
                >
                  {isLoadingRanking ? "Cargando..." : "Refrescar"}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/10 px-3 py-1 text-sm text-[color:var(--muted)] transition hover:border-white/20 hover:text-white"
                  onClick={() => setRankingModal(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>

            {syncProgress ? (
              <div className="mt-4 shrink-0 space-y-2">
                <div className="flex items-center justify-between text-xs text-[color:var(--muted)]">
                  <span>Sincronizando {syncProgress.currentName}...</span>
                  <span>{syncProgress.current} / {syncProgress.total}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[color:var(--accent)] transition-all duration-500"
                    style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : null}

            {isLoadingRanking ? (
              <p className="mt-5 text-sm text-[color:var(--muted)]">Cargando ranking...</p>
            ) : rankingItems.length === 0 ? (
              <p className="mt-5 text-sm text-[color:var(--muted)]">No hay alumnos en este proyecto.</p>
            ) : (
              <div className="mt-5 min-h-0 flex-1 overflow-auto rounded-2xl border border-white/10 bg-white/5 relative">
                {(() => {
                  const activeGroup = groups.find((g) => g.id === rankingModal?.groupId);
                  const showPeerVote = activeGroup?.peer_voting_enabled ?? false;
                  return (
                    <table className="min-w-full text-left text-sm">
                      <thead className="sticky top-0 z-10 bg-[#141a2a]/95 backdrop-blur">
                        <tr className="border-b border-white/10 text-[color:var(--muted)]">
                          <th className="px-4 py-3 font-medium">Ranking</th>
                          <th className="px-4 py-3 font-medium">Estudiante</th>
                          <th className="px-4 py-3 font-medium hidden sm:table-cell">GitHub</th>
                          <th className="px-4 py-3 font-medium">Contribuciones</th>
                          <th className="px-4 py-3 font-medium">Pts actividad</th>
                          <th className="px-4 py-3 font-medium">🔥 Racha</th>
                          {showPeerVote ? <th className="px-4 py-3 font-medium">Peer vote</th> : null}
                          <th className="px-4 py-3 font-medium">Promedio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankingItems.map((item) => {
                          return (
                            <tr key={item.usuario_id} className="border-b border-white/5 text-white/95 last:border-b-0">
                              <td className="px-4 py-3 font-mono text-xs text-[color:var(--accent)]">#{item.rank}</td>
                              <td className="px-4 py-3 font-medium">{item.nombre}</td>
                              <td className="px-4 py-3 hidden sm:table-cell">
                                {item.github_username ? (
                                  <a
                                    className="text-[color:var(--accent)] hover:underline"
                                    href={`https://github.com/${item.github_username}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    @{item.github_username}
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="px-4 py-3">{item.commits_count}</td>
                              <td className="px-4 py-3">{item.commits_points.toFixed(2)}</td>
                              <td className="px-4 py-3">
                                <span className={item.streak_days > 0 ? "font-medium text-orange-400" : "text-[color:var(--muted)]"}>
                                  {item.streak_days > 0 ? `🔥 ${item.streak_days}d` : "—"}
                                </span>
                              </td>
                              {showPeerVote ? (
                                <td className="px-4 py-3">
                                  <span className="text-amber-400">
                                    {item.peer_vote_avg > 0 ? `★ ${item.peer_vote_avg.toFixed(1)}` : "—"}
                                  </span>
                                </td>
                              ) : null}
                              <td className="px-4 py-3 font-semibold">{item.promedio.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {isNotificationsOpen ? (
        <div className="fixed inset-0 z-[72] flex items-center justify-center bg-[#16160f]/80 px-4">
          <div className="glass-panel w-full max-w-2xl rounded-[1.8rem] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[color:var(--foreground)]">Invitaciones</h3>
                <p className="mt-1 text-sm text-[color:var(--muted)]">{isLoadingInvites ? "Cargando..." : `Pendientes: ${inviteNotifications.length}`}</p>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-[color:var(--muted)] transition hover:border-white/20 hover:text-white"
                onClick={() => setIsNotificationsOpen(false)}
              >
                Cerrar
              </button>
            </div>

            {inviteNotifications.length > 0 ? (
              <div className="mt-5 max-h-80 space-y-2 overflow-y-auto">
                {inviteNotifications.map((invite) => (
                  <div key={invite.invite_code} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm text-white">{invite.source_group_nombre} ({invite.source_group_carrera} - {invite.source_group_semestre})</p>
                      <p className="text-xs text-[color:var(--muted)]">Enviado por @{invite.invited_by_docente_username}</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                      onClick={() => void handleAcceptNotificationInvite(invite.invite_code)}
                      disabled={isAcceptingShare}
                    >
                      Aceptar
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-[color:var(--muted)]">Sin invitaciones pendientes.</p>
            )}
          </div>
        </div>
      ) : null}

      {isGeneralRankingModalOpen ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-[#16160f]/80 px-4">
          <div className="glass-panel w-full max-w-6xl rounded-[1.8rem] p-7 flex max-h-[90vh] flex-col">
            <div className="flex flex-wrap items-start justify-between gap-3 shrink-0">
              <div>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[color:var(--foreground)]">Ranking general de tus proyectos</h3>
                <p className="mt-1 text-sm text-[color:var(--muted)]">Filtra por metrica y periodo usando solo los proyectos visibles ahora.</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm text-[color:var(--accent)]">Alumnos: {generalRankingItems.length}</p>
                <button
                  type="button"
                  className="rounded-full border border-white/10 px-3 py-1 text-sm text-[color:var(--muted)] transition hover:border-white/20 hover:text-white"
                  onClick={() => setIsGeneralRankingModalOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 pb-4 md:grid-cols-[0.9fr_0.9fr_0.9fr_0.9fr] shrink-0 border-b border-white/10">
              <select
                className="rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-[color:var(--accent)]/40"
                value={generalRankingMetric}
                onChange={(event) => setGeneralRankingMetric(event.target.value as "todo" | "commits" | "contribuciones")}
              >
                <option value="todo" className="bg-[#1a1a16] text-white">Todo</option>
                <option value="commits" className="bg-[#1a1a16] text-white">Commits</option>
                <option value="contribuciones" className="bg-[#1a1a16] text-white">Contribuciones GitHub</option>
              </select>
              <select
                className="rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-[color:var(--accent)]/40"
                value={generalRankingPeriod}
                onChange={(event) => setGeneralRankingPeriod(event.target.value as "7d" | "30d" | "90d" | "1y" | "all" | "custom")}
              >
                <option value="7d" className="bg-[#1a1a16] text-white">Ultimos 7 dias</option>
                <option value="30d" className="bg-[#1a1a16] text-white">Ultimos 30 dias</option>
                <option value="90d" className="bg-[#1a1a16] text-white">Ultimos 90 dias</option>
                <option value="1y" className="bg-[#1a1a16] text-white">Ultimo anio</option>
                <option value="all" className="bg-[#1a1a16] text-white">Todo</option>
                <option value="custom" className="bg-[#1a1a16] text-white">Rango personalizado</option>
              </select>
              <input
                type="date"
                className="rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-[color:var(--accent)]/40 disabled:opacity-40"
                value={generalRankingFromDate}
                onChange={(event) => setGeneralRankingFromDate(event.target.value)}
                disabled={generalRankingPeriod !== "custom"}
              />
              <input
                type="date"
                className="rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-[color:var(--accent)]/40 disabled:opacity-40"
                value={generalRankingToDate}
                onChange={(event) => setGeneralRankingToDate(event.target.value)}
                disabled={generalRankingPeriod !== "custom"}
              />
            </div>

            {isLoadingGeneralRanking ? (
              <p className="mt-4 text-sm text-[color:var(--muted)]">Cargando ranking general...</p>
            ) : generalRankingItems.length === 0 ? (
              <p className="mt-4 text-sm text-[color:var(--muted)]">No hay alumnos suficientes para construir el ranking general.</p>
            ) : (
              <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-2xl border border-white/10 bg-white/5">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-[color:var(--muted)]">
                      <th className="px-4 py-3 font-medium">Ranking</th>
                      <th className="px-4 py-3 font-medium">Alumno</th>
                      <th className="px-4 py-3 font-medium">GitHub</th>
                      <th className="px-4 py-3 font-medium">Grupo</th>
                      <th className="px-4 py-3 font-medium">{generalMetricLabel}</th>
                      <th className="px-4 py-3 font-medium">Puntos</th>
                      <th className="px-4 py-3 font-medium">🔥 Racha</th>
                      <th className="px-4 py-3 font-medium">⭐ Calif</th>
                      <th className="px-4 py-3 font-medium">{generalRankingMetric === "todo" ? "Promedio" : "Score"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generalRankingItems.map((item) => (
                      <tr key={`${item.group_id}-${item.usuario_id}`} className="border-b border-white/5 text-white/95 last:border-b-0">
                        <td className="px-4 py-3 font-mono text-xs text-[color:var(--accent)]">#{item.rank}</td>
                        <td className="px-4 py-3">{item.nombre}</td>
                        <td className="px-4 py-3">
                          {item.github_username ? (
                            <a
                              className="text-[color:var(--accent)] hover:underline"
                              href={`https://github.com/${item.github_username}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              @{item.github_username}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3">{item.group_name}</td>
                        <td className="px-4 py-3">{item.metric_value}</td>
                        <td className="px-4 py-3">{item.metric_points.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 text-xs font-semibold text-orange-300">
                            🔥 {item.streak_days}d
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-amber-400">
                            ★ {(item.star_rating ?? 0) > 0 ? (item.star_rating as number).toFixed(1) : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">{item.total_score.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {studentInviteModal ? (
        <div className="fixed inset-0 z-[99] flex items-center justify-center bg-[#16160f]/80 px-4">
          <div className="glass-panel w-full max-w-lg rounded-[1.8rem] p-7 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">Invitar alumnos</p>
                <h3 className="mt-2 font-serif text-2xl font-semibold text-[color:var(--foreground)]">
                  {studentInviteModal.groupName}
                </h3>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-[color:var(--muted)] transition hover:border-white/20 hover:text-white"
                onClick={() => { setStudentInviteModal(null); setCopiedInviteLink(false); }}
              >
                Cerrar
              </button>
            </div>

            {studentInviteModal.isLoading ? (
              <p className="text-sm text-[color:var(--muted)]">Generando link...</p>
            ) : studentInviteModal.link ? (
              <div className="space-y-4">
                <p className="text-sm text-[color:var(--muted)] leading-6">
                  Comparte este link con tus alumnos. Al abrirlo podrán registrarse directamente en este proyecto. El link es válido por 30 días.
                </p>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 break-all font-mono text-xs text-[color:var(--foreground)]">
                  {studentInviteModal.link}
                </div>
                <button
                  type="button"
                  className="w-full rounded-sm bg-[color:var(--accent)] px-4 py-3 font-serif text-sm font-semibold text-[#1a1a16] transition hover:bg-[color:var(--accent-strong)]"
                  onClick={() => void copyInviteLink(studentInviteModal.link!)}
                >
                  {copiedInviteLink ? "¡Copiado!" : "Copiar link"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-red-400">No se pudo generar el link. Intenta de nuevo.</p>
            )}
          </div>
        </div>
      ) : null}
    </DashboardShell>
  );
}
