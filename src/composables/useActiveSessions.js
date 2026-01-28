import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { createClient } from '@supabase/supabase-js';
import { playerID } from '/src/utils/player.js';
import { difficulty } from '/src/utils/config.js';

// ============================================================================
// CONFIGURACIÓN DE SUPABASE
// ============================================================================

const SUPABASE_CONFIG = {
    url: 'qyhvhcksequoqdqqrbdk.supabase.co',
    anonKey: 'sb_publishable_9AXBUSTlN-p0O87dg36HYw_zUbPipyo',     
};

const supabase = createClient(
    `https://${SUPABASE_CONFIG.url}`,
    SUPABASE_CONFIG.anonKey
);

// ============================================================================
// COMPOSABLE
// ============================================================================

export function useActiveSessions() {
    const activePlayers = ref([]);
    const onlineCount = ref(0);
    const myCurrentRank = ref(null);
    const myCurrentPlayer = ref(null);
    
    let heartbeatInterval = null;
    let subscription = null;
    let isSessionActive = false;

    // ✅ NUEVO: Computed para top 10 + yo (si no estoy en top 10)
    const displayPlayers = computed(() => {
        const top10 = activePlayers.value.slice(0, 10);
        
        // Si no estoy en el top 10, agregarme al final
        if (myCurrentRank.value && myCurrentRank.value > 10 && myCurrentPlayer.value) {
            return [...top10, myCurrentPlayer.value];
        }
        
        return top10;
    });

    /**
     * Registra el jugador actual como activo
     */
    async function startSession(playerName, score = 0) {
        if (isSessionActive) return;
        
        try {
            // Limpiar sesiones inactivas primero
            await cleanupInactiveSessions();

            const { data, error } = await supabase
                .from('active_sessions')
                .upsert({
                    player_id: playerID,
                    player_name: playerName,
                    current_score: score,
                    difficulty: difficulty.value,
                    last_heartbeat: new Date().toISOString(),
                }, {
                    onConflict: 'player_id'
                })
                .select()
                .single();

            if (error) throw error;

            isSessionActive = true;
            console.log('✅ Sesión iniciada:', data);

            // Cargar lista inmediatamente para mostrar al jugador
            await loadActiveSessions();

            // Enviar heartbeat cada 10 segundos
            startHeartbeat();
            
            return data;
        } catch (error) {
            console.error('❌ Error al iniciar sesión:', error);
        }
    }

    /**
     * Actualiza el puntaje del jugador actual
     */
    async function updateScore(score) {
        if (!isSessionActive) return;
        
        try {
            await supabase
                .from('active_sessions')
                .update({ 
                    current_score: score,
                    last_heartbeat: new Date().toISOString()
                })
                .eq('player_id', playerID);
        } catch (error) {
            console.error('❌ Error al actualizar puntaje:', error);
        }
    }

    /**
     * Mantiene la sesión activa con heartbeats
     */
    function startHeartbeat() {
        if (heartbeatInterval) return;

        heartbeatInterval = setInterval(async () => {
            try {
                await supabase
                    .from('active_sessions')
                    .update({ 
                        last_heartbeat: new Date().toISOString()
                    })
                    .eq('player_id', playerID);
                
                console.log('💓 Heartbeat enviado');
            } catch (error) {
                console.error('❌ Error en heartbeat:', error);
            }
        }, 10000); // Cada 10 segundos
    }

    /**
     * Termina la sesión del jugador
     */
    async function endSession() {
        if (!isSessionActive) return;
        
        stopHeartbeat();
        
        try {
            await supabase
                .from('active_sessions')
                .delete()
                .eq('player_id', playerID);
            
            isSessionActive = false;
            myCurrentRank.value = null;
            myCurrentPlayer.value = null;
            console.log('✅ Sesión terminada');
        } catch (error) {
            console.error('❌ Error al terminar sesión:', error);
        }
    }

    /**
     * Detiene los heartbeats
     */
    function stopHeartbeat() {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
    }

    /**
     * Limpia sesiones inactivas del servidor
     */
    async function cleanupInactiveSessions() {
        try {
            const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
            
            await supabase
                .from('active_sessions')
                .delete()
                .lt('last_heartbeat', thirtySecondsAgo);
        } catch (error) {
            console.error('❌ Error al limpiar sesiones:', error);
        }
    }

    /**
     * Suscribirse a cambios en tiempo real
     */
    function subscribeToSessions() {
        // Cargar sesiones iniciales
        loadActiveSessions();

        // Suscribirse a cambios en tiempo real
        subscription = supabase
            .channel('active_sessions_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'active_sessions'
                },
                (payload) => {
                    console.log('🔄 Cambio en tiempo real:', payload.eventType);
                    loadActiveSessions();
                }
            )
            .subscribe((status) => {
                console.log('📡 Realtime status:', status);
            });
    }

    /**
     * Carga todas las sesiones activas
     */
    async function loadActiveSessions() {
        try {
            const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
            
            const { data, error } = await supabase
                .from('active_sessions')
                .select('*')
                .gte('last_heartbeat', thirtySecondsAgo)
                .order('current_score', { ascending: false });

            if (error) throw error;

            activePlayers.value = data || [];
            onlineCount.value = data?.length || 0;
            
            // Calcular mi posición y datos
            const myIndex = data?.findIndex(p => p.player_id === playerID);
            if (myIndex !== -1) {
                myCurrentRank.value = myIndex + 1;
                myCurrentPlayer.value = { 
                    ...data[myIndex],
                    position: myIndex + 1 
                };
            } else {
                myCurrentRank.value = null;
                myCurrentPlayer.value = null;
            }
            
            console.log('👥 Jugadores activos:', onlineCount.value, '- Mi posición:', myCurrentRank.value);
        } catch (error) {
            console.error('❌ Error al cargar sesiones:', error);
            activePlayers.value = [];
            onlineCount.value = 0;
            myCurrentRank.value = null;
            myCurrentPlayer.value = null;
        }
    }

    /**
     * Desuscribirse de cambios
     */
    function unsubscribe() {
        if (subscription) {
            supabase.removeChannel(subscription);
            subscription = null;
        }
    }

    // Lifecycle
    onMounted(() => {
        subscribeToSessions();
    });

    onBeforeUnmount(() => {
        endSession();
        unsubscribe();
    });

    return {
        activePlayers,
        displayPlayers, // ✅ NUEVO: Lista optimizada para mostrar
        onlineCount,
        myCurrentRank,
        myCurrentPlayer, // ✅ NUEVO
        startSession,
        updateScore,
        endSession,
        subscribeToSessions,
    };
}