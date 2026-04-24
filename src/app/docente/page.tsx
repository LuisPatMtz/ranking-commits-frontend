"use client";

import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { readAuthSession } from "@/features/auth/session";
import { ApiError, apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  Group,
  GroupInviteCreatedResponse,
  GroupInviteNotification,
  CommitListItem,
  CommitListResponse,
  GroupRankingItem,
  GithubSyncResponse,
  GroupRankingGradesUpdatePayload,
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

type RankingDraftMap = Record<
  number,
  {
    docente: string;
    proyecto: string;
  }
>;

const initialGroupForm = {
  nombre: "",
  carrera: "",
  semestre: "",
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
  const [rankingDrafts, setRankingDrafts] = useState<RankingDraftMap>({});
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [isRefreshingRanking, setIsRefreshingRanking] = useState(false);
  const [isSavingRankingGrades, setIsSavingRankingGrades] = useState<number | null>(null);
  const [groupSearch, setGroupSearch] = useState("");
  const [filterCarrera, setFilterCarrera] = useState("all");
  const [filterSemestre, setFilterSemestre] = useState("all");
  const [groupsViewMode, setGroupsViewMode] = useState<"cards" | "list">("cards");
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

  const availableCarreras = Array.from(new Set(groups.map((group) => group.carrera))).sort((a, b) => a.localeCompare(b));
  const availableSemestres = Array.from(new Set(groups.map((group) => group.semestre))).sort((a, b) => a - b);

  const filteredGroups = groups.filter((group) => {
    const matchesSearch =
      group.nombre.toLowerCase().includes(groupSearch.trim().toLowerCase()) ||
      group.carrera.toLowerCase().includes(groupSearch.trim().toLowerCase());
    const matchesCarrera = filterCarrera === "all" || group.carrera === filterCarrera;
    const matchesSemestre = filterSemestre === "all" || String(group.semestre) === filterSemestre;
    return matchesSearch && matchesCarrera && matchesSemestre;
  });

  useEffect(() => {
    async function loadDocenteGroups() {
      if (!accessToken) {
        setGroups([]);
        setIsLoadingGroups(false);
        return;
      }

      setIsLoadingGroups(true);
      try {
        const myGroups = await apiGet<Group[]>("/grupos", accessToken);
        setGroups(myGroups);
      } catch (error) {
        setFeedback(error instanceof ApiError ? error.detail : "No se pudieron cargar tus grupos.");
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
        const invites = await apiGet<GroupInviteNotification[]>("/grupos/invitaciones/mias", accessToken);
        setInviteNotifications(invites);
      } catch {
        setInviteNotifications([]);
      } finally {
        setIsLoadingInvites(false);
      }
    }

    void loadInviteNotifications();
  }, [accessToken]);

  async function handleCreateGroup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingGroup(true);
    setFeedback("Creando grupo...");

    try {
      if (!accessToken) {
        setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
        return;
      }

      const createdGroup = await apiPost<Group>(
        "/grupos",
        {
          ...groupForm,
          semestre: Number(groupForm.semestre),
        },
        accessToken,
      );
      setGroups((current) => [createdGroup, ...current]);
      setFeedback(`Grupo ${createdGroup.nombre} creado correctamente.`);
      setSuccessModal({
        title: "Grupo creado",
        message: `El grupo ${createdGroup.nombre} se registro correctamente con semestre ${createdGroup.semestre}.`,
      });
      setGroupForm(initialGroupForm);
      setActiveModal(null);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo crear el grupo.");
    } finally {
      setIsSubmittingGroup(false);
    }
  }

  async function handleCreateParticipant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmittingStudent(true);
    setFeedback("Registrando participante...");

    try {
      if (!accessToken) {
        setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
        return;
      }
      if (!studentForm.grupo_id) {
        setFeedback("Selecciona un grupo para el participante.");
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
      const docentes = await apiGet<TeacherShareTarget[]>(`/grupos/docentes/buscar?q=${encodeURIComponent(query)}`, accessToken);
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
        `/grupos/${shareModal.groupId}/compartir`,
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
      const result = await apiPost<GroupShareLinkResponse>(`/grupos/${shareModal.groupId}/compartir/link`, {}, accessToken);
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
      const result = await apiPost<GroupShareResponse>(`/grupos/invitaciones/${encodeURIComponent(inviteCode)}/aceptar`, {}, accessToken);
      const updatedGroups = await apiGet<Group[]>("/grupos", accessToken);
      const updatedInvites = await apiGet<GroupInviteNotification[]>("/grupos/invitaciones/mias", accessToken);
      setGroups(updatedGroups);
      setInviteNotifications(updatedInvites);
      setAcceptShareToken("");
      setSuccessModal({
        title: "Grupo recibido",
        message: `Recibiste una copia del grupo con ${result.copied_students} alumnos. Sin calificaciones ni proyectos.`,
      });
      setFeedback("Grupo recibido correctamente desde link.");
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
      const result = await apiPost<GroupShareResponse>(`/grupos/invitaciones/${encodeURIComponent(inviteCode)}/aceptar`, {}, accessToken);
      const updatedGroups = await apiGet<Group[]>("/grupos", accessToken);
      const updatedInvites = await apiGet<GroupInviteNotification[]>("/grupos/invitaciones/mias", accessToken);
      setGroups(updatedGroups);
      setInviteNotifications(updatedInvites);
      setSuccessModal({
        title: "Invitacion aceptada",
        message: `Se copio el grupo con ${result.copied_students} alumnos, sin calificaciones ni proyectos.`,
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
      apiGet<GroupStudent[]>(`/grupos/${groupId}/alumnos`, token),
      apiGet<GroupStudentCandidate[]>(`/grupos/${groupId}/alumnos/disponibles`, token),
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
      setFeedback(error instanceof ApiError ? error.detail : "No se pudieron cargar los alumnos del grupo.");
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
        `/grupos/${membersModal.groupId}/alumnos`,
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

  async function handleRemoveStudentFromGroup(participantId: number) {
    if (!accessToken) {
      setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
      return;
    }
    if (!membersModal) {
      return;
    }

    setIsSubmittingMemberChange(true);
    try {
      await apiDelete<{ message: string }>(`/grupos/${membersModal.groupId}/alumnos/participantes/${participantId}`, accessToken);
      await loadGroupMembersContext(membersModal.groupId, accessToken);
      setFeedback("Alumno removido del grupo.");
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo remover el alumno.");
    } finally {
      setIsSubmittingMemberChange(false);
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
    const items = await apiGet<GroupRankingItem[]>(`/ranking/grupo/${groupId}?days=3650`, token);
    setRankingItems(items);
    setRankingDrafts(
      items.reduce<RankingDraftMap>((acc, item) => {
        acc[item.usuario_id] = {
          docente: String(item.docente_grade),
          proyecto: String(item.proyecto_grade),
        };
        return acc;
      }, {}),
    );
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
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo cargar el ranking del grupo.");
      setRankingModal(null);
    } finally {
      setIsLoadingRanking(false);
    }
  }

  async function handleSaveRankingGrades(item: GroupRankingItem) {
    if (!accessToken || !rankingModal) {
      setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
      return;
    }

    const draft = rankingDrafts[item.usuario_id];
    const docenteValue = Number(draft?.docente ?? item.docente_grade);
    const proyectoValue = Number(draft?.proyecto ?? item.proyecto_grade);

    if (Number.isNaN(docenteValue) || Number.isNaN(proyectoValue)) {
      setFeedback("Ingresa calificaciones numericas validas.");
      return;
    }

    const payload: GroupRankingGradesUpdatePayload = {
      usuario_id: item.usuario_id,
      docente_grade: Math.min(100, Math.max(0, docenteValue)),
      proyecto_grade: Math.min(100, Math.max(0, proyectoValue)),
    };

    setIsSavingRankingGrades(item.usuario_id);
    try {
      await apiPut<{ message: string }>(`/ranking/grupo/${rankingModal.groupId}/calificaciones`, payload, accessToken);
      await loadGroupRanking(rankingModal.groupId, accessToken);
      setFeedback(`Calificaciones actualizadas para ${item.nombre}.`);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudieron actualizar las calificaciones.");
    } finally {
      setIsSavingRankingGrades(null);
    }
  }

  async function handleRefreshRankingWithSync() {
    if (!accessToken || !rankingModal) {
      setFeedback("Tu sesion no es valida. Inicia sesion nuevamente.");
      return;
    }

    setIsRefreshingRanking(true);
    try {
      let membersToSync: number[] = rankingItems.map((item) => item.usuario_id);

      if (membersToSync.length === 0) {
        const members = await apiGet<GroupStudent[]>(`/grupos/${rankingModal.groupId}/alumnos`, accessToken);
        membersToSync = members.map((member) => member.usuario_id);
      }

      let syncedMembers = 0;
      let totalNewCommits = 0;

      for (const usuarioId of membersToSync) {
        try {
          const result = await apiPost<GithubSyncResponse>(`/github/sync/${usuarioId}?days=3650`, {}, accessToken);
          syncedMembers += 1;
          totalNewCommits += result.commits_nuevos;
        } catch {
          // Skip users without GitHub username or with GitHub API errors.
        }
      }

      await loadGroupRanking(rankingModal.groupId, accessToken);
      setFeedback(`Refrescado: ${syncedMembers} alumnos sincronizados, ${totalNewCommits} commits nuevos.`);
    } catch (error) {
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
        className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[color:var(--accent-strong)]"
        onClick={() => setActiveModal("group")}
      >
        Nuevo grupo
      </button>
      <button
        type="button"
        className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-[color:var(--accent)]/35 hover:bg-white/10"
        onClick={() => setActiveModal("participant")}
      >
        Nuevo participante
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Mis cursos</h3>
          <p className="text-sm text-[color:var(--muted)]">Total: {filteredGroups.length}</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[0.9fr_1.2fr_0.9fr_0.8fr]">
          <select
            className="rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-[color:var(--accent)]/40"
            value={filterSemestre}
            onChange={(event) => setFilterSemestre(event.target.value)}
          >
            <option value="all" className="bg-slate-900 text-white">Todos los semestres</option>
            {availableSemestres.map((semestre) => (
              <option key={semestre} value={String(semestre)} className="bg-slate-900 text-white">
                Semestre {semestre}
              </option>
            ))}
          </select>
          <input
            className="rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
            placeholder="Buscar grupo o carrera"
            value={groupSearch}
            onChange={(event) => setGroupSearch(event.target.value)}
          />
          <select
            className="rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-[color:var(--accent)]/40"
            value={filterCarrera}
            onChange={(event) => setFilterCarrera(event.target.value)}
          >
            <option value="all" className="bg-slate-900 text-white">Todas las carreras</option>
            {availableCarreras.map((carrera) => (
              <option key={carrera} value={carrera} className="bg-slate-900 text-white">
                {carrera}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none focus:border-[color:var(--accent)]/40"
            value={groupsViewMode}
            onChange={(event) => setGroupsViewMode(event.target.value as "cards" | "list")}
          >
            <option value="cards" className="bg-slate-900 text-white">Tarjeta</option>
            <option value="list" className="bg-slate-900 text-white">Lista</option>
          </select>
        </div>
        {feedback ? (
          <p className="mt-3 text-sm text-[color:var(--accent)]">{feedback}</p>
        ) : null}

        {isLoadingGroups ? (
          <p className="mt-4 text-sm text-[color:var(--muted)]">Cargando tus grupos...</p>
        ) : !accessToken ? (
          <p className="mt-4 text-sm text-[color:var(--muted)]">Inicia sesion para consultar tus grupos.</p>
        ) : filteredGroups.length === 0 ? (
          <p className="mt-4 text-sm text-[color:var(--muted)]">Aun no has creado grupos.</p>
        ) : groupsViewMode === "cards" ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredGroups.map((group, index) => (
              <article key={group.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div
                  className="h-20 w-full"
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
                  <h4 className="text-base font-semibold text-white">{group.nombre}</h4>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">
                    {group.carrera} - Semestre {group.semestre}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[color:var(--accent)]/50 hover:bg-white/10"
                      onClick={() => void openMembersModal(group)}
                    >
                      Alumnos
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[color:var(--accent)]/50 hover:bg-white/10"
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
      </section>
      )}

      {activeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4">
          <div className="glass-panel w-full max-w-xl rounded-[1.8rem] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">
                  {activeModal === "group" ? "Nuevo grupo" : "Nuevo participante"}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {activeModal === "group" ? "Agregar grupo" : "Agregar participante"}
                </h3>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-[color:var(--muted)] transition hover:border-white/20 hover:text-white"
                onClick={() => setActiveModal(null)}
              >
                Cerrar
              </button>
            </div>

            {activeModal === "group" ? (
              <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleCreateGroup}>
                <input
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40 sm:col-span-2"
                  placeholder="Nombre del grupo"
                  value={groupForm.nombre}
                  onChange={(event) => setGroupForm((current) => ({ ...current, nombre: event.target.value }))}
                  required
                />
                <input
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
                  placeholder="Carrera"
                  value={groupForm.carrera}
                  onChange={(event) => setGroupForm((current) => ({ ...current, carrera: event.target.value }))}
                  required
                />
                <input
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
                  placeholder="Semestre"
                  type="number"
                  min="1"
                  max="12"
                  value={groupForm.semestre}
                  onChange={(event) => setGroupForm((current) => ({ ...current, semestre: event.target.value }))}
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmittingGroup}
                  className="sm:col-span-2 rounded-full bg-[color:var(--accent)] px-5 py-3 font-semibold text-slate-950 transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmittingGroup ? "Guardando grupo..." : "Guardar grupo"}
                </button>
              </form>
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
                  <option value="" className="bg-slate-900 text-slate-300">
                    Selecciona un grupo
                  </option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id} className="bg-slate-900 text-white">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4">
          <div className="glass-panel w-full max-w-md rounded-[1.8rem] p-7">
            <h3 className="mt-3 text-2xl font-semibold text-white">{successModal.title}</h3>
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 px-4">
          <div className="glass-panel w-full max-w-xl rounded-[1.8rem] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">Compartir grupo</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{shareModal.groupName}</h3>
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
              {isSubmittingShare ? "Compartiendo..." : "Compartir grupo"}
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
                    className="mt-3 w-full rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-white/90"
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
        <div className="fixed inset-0 z-[71] flex items-center justify-center bg-slate-950/70 px-4">
          <div className="glass-panel w-full max-w-3xl rounded-[1.8rem] p-7">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-2xl font-semibold text-white">{membersModal.groupName}</h3>
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
                <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <select
                    className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none focus:border-[color:var(--accent)]/40"
                    value={selectedCandidateParticipantId}
                    onChange={(event) => setSelectedCandidateParticipantId(event.target.value)}
                    disabled={isSubmittingMemberChange || candidateStudents.length === 0}
                  >
                    <option value="" className="bg-slate-900 text-slate-300">
                      {candidateStudents.length === 0 ? "Sin alumnos disponibles" : "Selecciona un alumno"}
                    </option>
                    {candidateStudents.map((candidate) => (
                      <option key={candidate.participant_id} value={candidate.participant_id} className="bg-slate-900 text-white">
                        {candidate.nombre} (@{candidate.username})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={() => void handleAddStudentToGroup()}
                    disabled={isSubmittingMemberChange || !selectedCandidateParticipantId}
                  >
                    Agregar
                  </button>
                </div>

                <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
                  {groupMembers.length === 0 ? (
                    <p className="px-4 py-4 text-sm text-[color:var(--muted)]">Este grupo no tiene alumnos.</p>
                  ) : (
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-white/10 text-[color:var(--muted)]">
                          <th className="px-4 py-3 font-medium">Alumno</th>
                          <th className="px-4 py-3 font-medium">Username</th>
                          <th className="px-4 py-3 font-medium">GitHub</th>
                          <th className="px-4 py-3 font-medium text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupMembers.map((member) => (
                          <tr key={member.participant_id} className="border-b border-white/5 text-white/95 last:border-b-0">
                            <td className="px-4 py-3">{member.nombre}</td>
                            <td className="px-4 py-3">@{member.username}</td>
                            <td className="px-4 py-3">{member.github_username ? `@${member.github_username}` : "-"}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                className="mr-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[color:var(--accent)]/50 hover:bg-white/10"
                                onClick={() => void openMemberCommitsModal(member)}
                              >
                                Commits
                              </button>
                              <button
                                type="button"
                                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-red-300/50 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-70"
                                onClick={() => void handleRemoveStudentFromGroup(member.participant_id)}
                                disabled={isSubmittingMemberChange}
                              >
                                Quitar
                              </button>
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

      {memberCommitsModal ? (
        <div className="fixed inset-0 z-[73] flex items-center justify-center bg-slate-950/70 px-4">
          <div className="glass-panel flex max-h-[88vh] w-full max-w-4xl flex-col rounded-[1.8rem] p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold text-white">{memberCommitsModal.nombre}</h3>
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
              <div className="mt-5 min-h-0 flex-1 overflow-auto rounded-2xl border border-white/10 bg-white/5">
                <table className="min-w-full text-left text-sm">
                  <thead>
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
        <div className="fixed inset-0 z-[74] flex items-center justify-center bg-slate-950/70 px-4">
          <div className="glass-panel w-full max-w-6xl rounded-[1.8rem] p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-2xl font-semibold text-white">Ranking - {rankingModal.groupName}</h3>
                <p className="text-sm text-[color:var(--muted)]">Escala 0-100 por criterio. Puntos por commits usan regla de 3 con maximo del grupo.</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:border-[color:var(--accent)]/50 hover:bg-white/10"
                  onClick={() => void handleRefreshRankingWithSync()}
                  disabled={isLoadingRanking || isRefreshingRanking}
                >
                  {isRefreshingRanking ? "Sincronizando..." : isLoadingRanking ? "Cargando..." : "Refrescar"}
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

            {isLoadingRanking ? (
              <p className="mt-5 text-sm text-[color:var(--muted)]">Cargando ranking...</p>
            ) : rankingItems.length === 0 ? (
              <p className="mt-5 text-sm text-[color:var(--muted)]">No hay alumnos en este grupo.</p>
            ) : (
              <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-[color:var(--muted)]">
                      <th className="px-4 py-3 font-medium">Ranking</th>
                      <th className="px-4 py-3 font-medium">Estudiante</th>
                      <th className="px-4 py-3 font-medium">GitHub</th>
                      <th className="px-4 py-3 font-medium">Commits</th>
                      <th className="px-4 py-3 font-medium">Puntos commits</th>
                      <th className="px-4 py-3 font-medium">Calif maestro</th>
                      <th className="px-4 py-3 font-medium">Calif proyecto</th>
                      <th className="px-4 py-3 font-medium">Promedio</th>
                      <th className="px-4 py-3 font-medium text-right">Guardar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankingItems.map((item) => {
                      const draft = rankingDrafts[item.usuario_id] ?? {
                        docente: String(item.docente_grade),
                        proyecto: String(item.proyecto_grade),
                      };
                      return (
                        <tr key={item.usuario_id} className="border-b border-white/5 text-white/95 last:border-b-0">
                          <td className="px-4 py-3">#{item.rank}</td>
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
                          <td className="px-4 py-3">{item.commits_count}</td>
                          <td className="px-4 py-3">{item.commits_points.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              className="w-24 rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1 text-white"
                              value={draft.docente}
                              onChange={(event) =>
                                setRankingDrafts((current) => ({
                                  ...current,
                                  [item.usuario_id]: {
                                    docente: event.target.value,
                                    proyecto: current[item.usuario_id]?.proyecto ?? String(item.proyecto_grade),
                                  },
                                }))
                              }
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              className="w-24 rounded-lg border border-white/10 bg-slate-950/40 px-2 py-1 text-white"
                              value={draft.proyecto}
                              onChange={(event) =>
                                setRankingDrafts((current) => ({
                                  ...current,
                                  [item.usuario_id]: {
                                    docente: current[item.usuario_id]?.docente ?? String(item.docente_grade),
                                    proyecto: event.target.value,
                                  },
                                }))
                              }
                            />
                          </td>
                          <td className="px-4 py-3 font-semibold">{item.promedio.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-[color:var(--accent)]/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                              onClick={() => void handleSaveRankingGrades(item)}
                              disabled={isSavingRankingGrades === item.usuario_id}
                            >
                              {isSavingRankingGrades === item.usuario_id ? "Guardando..." : "Guardar"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {isNotificationsOpen ? (
        <div className="fixed inset-0 z-[72] flex items-center justify-center bg-slate-950/70 px-4">
          <div className="glass-panel w-full max-w-2xl rounded-[1.8rem] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold text-white">Invitaciones</h3>
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
    </DashboardShell>
  );
}
