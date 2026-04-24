"use client";

import { useEffect, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { readAuthSession } from "@/features/auth/session";
import { ApiError, apiGet, apiPost } from "@/lib/api";
import type {
  Group,
  GroupInviteCreatedResponse,
  GroupInviteNotification,
  GroupShareLinkResponse,
  GroupShareResponse,
  Participant,
  TeacherShareTarget,
  User,
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

const initialGroupForm = {
  nombre: "",
  carrera: "",
  semestre: "",
};

const initialStudentForm = {
  nombre: "",
  username: "",
  password: "",
  github_username: "",
};

export default function DocentePage() {
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
  const [acceptShareToken, setAcceptShareToken] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }
    return new URLSearchParams(window.location.search).get("invite") || "";
  });
  const [isAcceptingShare, setIsAcceptingShare] = useState(false);
  const session = readAuthSession();
  const accessToken = session?.access_token;

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
    setFeedback("Registrando alumno y participante...");

    try {
      const createdUser = await apiPost<User>("/usuarios", {
        nombre: studentForm.nombre,
        username: studentForm.username.trim(),
        password: studentForm.password,
        rol: "alumno",
      });

      const participantPayload = {
        usuario_id: createdUser.id,
        github_username: studentForm.github_username.trim() || null,
      };

      const participant = await apiPost<Participant>("/participantes", participantPayload);
      setFeedback(`Alumno ${createdUser.nombre} registrado y vinculado como participante #${participant.id}.`);
      setSuccessModal({
        title: "Alumno registrado",
        message: `Se creo la cuenta de ${createdUser.nombre} y se vinculo como participante #${participant.id}.`,
      });
      setStudentForm(initialStudentForm);
      setActiveModal(null);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.detail : "No se pudo registrar el alumno.");
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
        className="relative rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-[color:var(--accent)]/35 hover:bg-white/10"
        onClick={() => setIsNotificationsOpen(true)}
      >
        Notificaciones
        {inviteNotifications.length > 0 ? (
          <span className="ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-[color:var(--accent)] px-2 py-0.5 text-xs font-bold text-slate-950">
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
        Nuevo alumno
      </button>
    </>
  );

  return (
    <DashboardShell
      title="Panel Docente"
      subtitle="Gestiona altas academicas y operaciones del curso desde este espacio."
      headerActions={docenteHeaderActions}
    >
      <section className="glass-panel rounded-[1.5rem] p-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">Aceptar grupo por link</p>
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
          <h3 className="text-lg font-semibold text-white">Mis grupos creados</h3>
          <p className="text-sm text-[color:var(--muted)]">Total: {groups.length}</p>
        </div>
        {feedback ? (
          <p className="mt-3 text-sm text-[color:var(--accent)]">{feedback}</p>
        ) : null}

        {isLoadingGroups ? (
          <p className="mt-4 text-sm text-[color:var(--muted)]">Cargando tus grupos...</p>
        ) : !accessToken ? (
          <p className="mt-4 text-sm text-[color:var(--muted)]">Inicia sesion para consultar tus grupos.</p>
        ) : groups.length === 0 ? (
          <p className="mt-4 text-sm text-[color:var(--muted)]">Aun no has creado grupos.</p>
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
                {groups.map((group) => (
                  <tr key={group.id} className="border-b border-white/5 text-white/95 last:border-b-0">
                    <td className="px-4 py-3">{group.id}</td>
                    <td className="px-4 py-3">{group.nombre}</td>
                    <td className="px-4 py-3">{group.carrera}</td>
                    <td className="px-4 py-3">{group.semestre}</td>
                    <td className="px-4 py-3 text-right">
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

      {activeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4">
          <div className="glass-panel w-full max-w-xl rounded-[1.8rem] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">
                  {activeModal === "group" ? "Nuevo grupo" : "Nuevo alumno participante"}
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {activeModal === "group" ? "Agregar grupo" : "Agregar participante o alumno"}
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
                <input
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
                  placeholder="Username"
                  value={studentForm.username}
                  onChange={(event) => setStudentForm((current) => ({ ...current, username: event.target.value }))}
                  required
                />
                <input
                  className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-[color:var(--accent)]/40"
                  placeholder="Contrasena temporal"
                  type="password"
                  value={studentForm.password}
                  onChange={(event) => setStudentForm((current) => ({ ...current, password: event.target.value }))}
                  required
                />
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
                  {isSubmittingStudent ? "Guardando alumno..." : "Guardar alumno y participante"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {successModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4">
          <div className="glass-panel w-full max-w-md rounded-[1.8rem] p-7">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">Confirmacion</p>
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
                <p className="text-sm font-semibold text-white">O compartir por link</p>
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

      {isNotificationsOpen ? (
        <div className="fixed inset-0 z-[72] flex items-center justify-center bg-slate-950/70 px-4">
          <div className="glass-panel w-full max-w-2xl rounded-[1.8rem] p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-[color:var(--accent)]">Notificaciones</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Invitaciones recibidas</h3>
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
