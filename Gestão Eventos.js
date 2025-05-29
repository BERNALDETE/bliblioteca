import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

// Global variables provided by the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

function App() {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // State for Events
    const [events, setEvents] = useState([]);
    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDescription, setNewEventDescription] = useState('');
    const [newEventDate, setNewEventDate] = useState('');
    const [newEventTime, setNewEventTime] = useState('');
    const [editingEventId, setEditingEventId] = useState(null);

    // Initialize Firebase and set up Auth listener
    useEffect(() => {
        try {
            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const firebaseAuth = getAuth(app);

            setDb(firestore);
            setAuth(firebaseAuth);

            // Sign in anonymously or with custom token
            const signIn = async () => {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(firebaseAuth, initialAuthToken);
                    } else {
                        await signInAnonymously(firebaseAuth);
                    }
                } catch (error) {
                    console.error("Erro ao autenticar no Firebase:", error);
                }
            };

            signIn();

            // Listen for auth state changes
            const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    // If user logs out or token expires, sign in anonymously again
                    signInAnonymously(firebaseAuth).then((userCredential) => {
                        setUserId(userCredential.user.uid);
                    }).catch((error) => {
                        console.error("Erro ao tentar login anônimo após desautenticação:", error);
                    });
                }
                setIsAuthReady(true);
            });

            return () => unsubscribe(); // Cleanup auth listener on unmount
        } catch (error) {
            console.error("Erro ao inicializar Firebase:", error);
        }
    }, []);

    // Fetch data from Firestore once auth is ready
    useEffect(() => {
        if (db && userId && isAuthReady) {
            // Fetch Events
            const eventsQuery = collection(db, `artifacts/${appId}/users/${userId}/events`);
            const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
                const fetchedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setEvents(fetchedEvents);
            }, (error) => {
                console.error("Erro ao buscar eventos:", error);
            });

            return () => {
                unsubscribeEvents();
            }; // Cleanup listeners
        }
    }, [db, userId, isAuthReady]);

    // --- Event Management Functions ---
    const handleAddOrUpdateEvent = async () => {
        if (!newEventTitle.trim() || !newEventDescription.trim() || !newEventDate.trim() || !newEventTime.trim()) return;
        try {
            if (editingEventId) {
                // Update existing event
                await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/events`, editingEventId), {
                    title: newEventTitle,
                    description: newEventDescription,
                    date: newEventDate,
                    time: newEventTime,
                    updatedAt: new Date(),
                });
                setEditingEventId(null);
            } else {
                // Add new event
                await addDoc(collection(db, `artifacts/${appId}/users/${userId}/events`), {
                    title: newEventTitle,
                    description: newEventDescription,
                    date: newEventDate,
                    time: newEventTime,
                    createdAt: new Date(),
                });
            }
            setNewEventTitle('');
            setNewEventDescription('');
            setNewEventDate('');
            setNewEventTime('');
        } catch (e) {
            console.error("Erro ao adicionar/atualizar evento: ", e);
        }
    };

    const handleEditEvent = (eventItem) => {
        setNewEventTitle(eventItem.title);
        setNewEventDescription(eventItem.description);
        setNewEventDate(eventItem.date);
        setNewEventTime(eventItem.time);
        setEditingEventId(eventItem.id);
    };

    const handleDeleteEvent = async (id) => {
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/events`, id));
        } catch (e) {
            console.error("Erro ao deletar evento: ", e);
        }
    };

    if (!isAuthReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <p className="text-lg text-gray-700">Carregando painel de gestão de eventos...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            {/* Cabeçalho Principal */}
            <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2">Painel de Gestão de Eventos</h1>
                <p className="text-center text-blue-200">Gerencie os eventos da escola</p>
                {userId && <p className="text-center text-sm mt-2">ID do Usuário: {userId}</p>}
            </header>

            {/* Navegação (para referência, não funcional para navegação interna na gestão) */}
            <nav className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-wrap justify-center gap-4">
                <a href="index.html" className="text-blue-700 hover:text-blue-900 font-semibold px-4 py-2 rounded-md transition duration-300 ease-in-out hover:bg-blue-100">Início</a>
                <a href="contatos.html" className="text-blue-700 hover:text-blue-900 font-semibold px-4 py-2 rounded-md transition duration-300 ease-in-out hover:bg-blue-100">Contatos (Público)</a>
                <a href="galeria.html" className="text-blue-700 hover:text-blue-900 font-semibold px-4 py-2 rounded-md transition duration-300 ease-in-out hover:bg-blue-100">Galeria</a>
                <a href="eventos.html" className="text-blue-700 hover:text-blue-900 font-semibold px-4 py-2 rounded-md transition duration-300 ease-in-out hover:bg-blue-100">Eventos (Público)</a>
                <a href="projetos.html" className="text-blue-700 hover:text-blue-900 font-semibold px-4 py-2 rounded-md transition duration-300 ease-in-out hover:bg-blue-100">Projetos</a>
                <a href="index.html#sobre" className="text-blue-700 hover:text-blue-900 font-semibold px-4 py-2 rounded-md transition duration-300 ease-in-out hover:bg-blue-100">Sobre</a>
                <a href="gestao.html" className="text-blue-700 hover:text-blue-900 font-semibold px-4 py-2 rounded-md transition duration-300 ease-in-out hover:bg-blue-100">Gestão Geral</a>
                <a href="projetos-gestao.html" className="text-blue-700 hover:text-blue-900 font-semibold px-4 py-2 rounded-md transition duration-300 ease-in-out hover:bg-blue-100">Gestão de Projetos</a>
                <a href="contatos-gestao.html" className="text-blue-700 hover:text-blue-900 font-semibold px-4 py-2 rounded-md transition duration-300 ease-in-out hover:bg-blue-100">Gestão de Contatos</a>
            </nav>

            {/* Seção de Gestão de Eventos */}
            <section className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-2xl font-bold text-blue-700 mb-4 border-b-2 border-blue-300 pb-2">Adicionar/Editar Evento</h2>
                <div className="flex flex-col gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Título do Evento"
                        className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                    />
                    <textarea
                        placeholder="Descrição do Evento"
                        rows="4"
                        className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 resize-y"
                        value={newEventDescription}
                        onChange={(e) => setNewEventDescription(e.target.value)}
                    ></textarea>
                    <input
                        type="date"
                        placeholder="Data do Evento"
                        className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                    />
                    <input
                        type="time"
                        placeholder="Hora do Evento"
                        className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                    />
                    <button
                        onClick={handleAddOrUpdateEvent}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 ease-in-out"
                    >
                        {editingEventId ? 'Atualizar Evento' : 'Adicionar Evento'}
                    </button>
                    {editingEventId && (
                        <button
                            onClick={() => {
                                setNewEventTitle('');
                                setNewEventDescription('');
                                setNewEventDate('');
                                setNewEventTime('');
                                setEditingEventId(null);
                            }}
                            className="bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500 transition duration-300 ease-in-out"
                        >
                            Cancelar Edição
                        </button>
                    )}
                </div>
                <h2 className="text-2xl font-bold text-blue-700 mb-4 border-b-2 border-blue-300 pb-2 mt-8">Eventos Existentes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {events.map((event) => (
                        <div key={event.id} className="bg-gray-100 p-4 rounded-lg shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-blue-800 mb-1">{event.title}</h3>
                                <p className="text-gray-600 text-sm">{event.description}</p>
                                <p className="text-gray-600 text-sm">Data: {event.date}</p>
                                <p className="text-gray-600 text-sm">Hora: {event.time}</p>
                            </div>
                            <div className="flex justify-end gap-2 mt-3">
                                <button
                                    onClick={() => handleEditEvent(event)}
                                    className="text-blue-500 hover:text-blue-700 transition duration-300 ease-in-out"
                                    aria-label="Editar Evento"
                                >
                                    <i className="fas fa-edit"></i>
                                </button>
                                <button
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="text-red-500 hover:text-red-700 transition duration-300 ease-in-out"
                                    aria-label="Deletar Evento"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                    {events.length === 0 && <p className="text-gray-500 col-span-full text-center">Nenhum evento adicionado ainda.</p>}
                </div>
            </section>

            {/* Rodapé Consistente */}
            <footer id="footer-contatos" className="bg-blue-700 text-white p-6 rounded-lg shadow-lg mt-8 text-center">
                <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
                    <div className="flex flex-col items-center md:items-end">
                        <p className="font-semibold">Endereço:</p>
                        <p>Rua 07 - Quadra 39-lotes 07, 08, 09 e 10, Setor Vila Nova, Paranã-TO, 77360-000</p>
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                        <p className="font-semibold">Telefone: (63) 3371-1506</p>
                        <p className="font-semibold">Email: semed.floracy@gmail.com</p>
                    </div>
                    <div className="flex space-x-4 mt-2 md:mt-0 md:ml-4">
                        <a href="#" className="text-white hover:text-blue-200 transition duration-300 ease-in-out text-2xl" aria-label="Facebook">
                            <i className="fab fa-facebook-square"></i>
                        </a>
                        <a href="#" className="text-white hover:text-blue-200 transition duration-300 ease-in-out text-2xl" aria-label="Instagram">
                            <i className="fab fa-instagram"></i>
                        </a>
                        <a href="#" className="text-white hover:text-blue-200 transition duration-300 ease-in-out text-2xl" aria-label="Twitter">
                            <i className="fab fa-twitter-square"></i>
                        </a>
                    </div>
                </div>
                <div className="border-t border-blue-600 pt-4 mt-6 text-center">
                    <p>&copy; 2023 Escola Municipal Professora Floracy Bonfim Pereira de Araújo. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}

export default App;
