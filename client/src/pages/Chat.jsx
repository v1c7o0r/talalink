import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  TextField,
  IconButton,
  Stack,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Send, Search } from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import SideBar from '../components/Layout/SideBar';

const API_BASE = 'http://127.0.0.1:5000';

const darkInputStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    '& fieldset': {
      borderColor: '#1e3a8a',
    },
    '&:hover fieldset': {
      borderColor: '#2563eb',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#3b82f6',
    },
  },
  '& .MuiInputBase-input::placeholder': {
    color: '#94a3b8',
    opacity: 1,
  },
};

const Chat = () => {
  const location = useLocation();

  const token = localStorage.getItem('token');
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  const currentUserId = currentUser.id;

  const queryParams = new URLSearchParams(location.search);
  const queryChatId = queryParams.get('chatId');

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(queryChatId ? Number(queryChatId) : null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [pageError, setPageError] = useState('');

  const fetchChats = useCallback(async () => {
    if (!token) {
      setChats([]);
      setLoadingChats(false);
      setPageError('You are not logged in.');
      return;
    }

    try {
      setLoadingChats(true);
      setPageError('');

      const res = await fetch(`${API_BASE}/chats`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let data = [];
      try {
        data = await res.json();
      } catch {
        throw new Error('Backend did not return valid chat data.');
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch chats');
      }

      const chatList = Array.isArray(data) ? data : [];
      setChats(chatList);

      if (queryChatId) {
        const chatExists = chatList.some((chat) => Number(chat.id) === Number(queryChatId));
        if (chatExists) {
          setActiveChatId(Number(queryChatId));
        } else if (chatList.length > 0) {
          setActiveChatId(chatList[0].id);
        }
      } else if (chatList.length > 0 && !activeChatId) {
        setActiveChatId(chatList[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      setChats([]);
      setPageError(error.message || 'Failed to fetch chats');
    } finally {
      setLoadingChats(false);
    }
  }, [token, queryChatId, activeChatId]);

  const fetchMessages = useCallback(
    async (chatId) => {
      if (!chatId || !token) return;

      try {
        setLoadingMessages(true);
        setPageError('');

        const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        let data = [];
        try {
          data = await res.json();
        } catch {
          throw new Error('Backend did not return valid messages.');
        }

        if (!res.ok) {
          throw new Error(data.error || data.message || 'Failed to fetch messages');
        }

        setMessages(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        setMessages([]);
        setPageError(error.message || 'Failed to fetch messages');
      } finally {
        setLoadingMessages(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (currentUserId && token) {
      fetchChats();
    }
  }, [currentUserId, token, fetchChats]);

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
    }
  }, [activeChatId, fetchMessages]);

  const filteredChats = useMemo(() => {
    return chats.filter((chat) =>
      (chat.participant_name || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [chats, search]);

  const activeChat = chats.find((chat) => Number(chat.id) === Number(activeChatId));

  const handleSendMessage = async () => {
    const trimmed = message.trim();

    if (!trimmed || !activeChatId || !currentUserId || !token) return;

    try {
      setPageError('');

      const res = await fetch(`${API_BASE}/chats/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          chat_id: activeChatId,
          text: trimmed,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('Backend did not return valid send-message response.');
      }

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to send message');
      }

      setMessage('');
      await fetchMessages(activeChatId);
      await fetchChats();
    } catch (error) {
      console.error('Failed to send message:', error);
      setPageError(error.message || 'Failed to send message');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: '#020617',
        background: 'linear-gradient(135deg, #000000 0%, #020617 45%, #0f172a 100%)',
        overflow: 'hidden',
      }}
    >
      <SideBar isLoggedIn={true} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, md: 3 },
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {pageError && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              bgcolor: 'rgba(211, 47, 47, 0.12)',
              color: '#fff',
              border: '1px solid rgba(244,67,54,0.3)',
              '& .MuiAlert-icon': { color: '#ff6b6b' },
            }}
          >
            {pageError}
          </Alert>
        )}

        <Grid
          container
          spacing={0}
          sx={{
            height: '92vh',
            borderRadius: 4,
            overflow: 'hidden',
            border: '1px solid rgba(59,130,246,0.18)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.45)',
            background: 'rgba(2, 6, 23, 0.95)',
          }}
        >
          <Grid
            item
            xs={12}
            md={4}
            sx={{
              bgcolor: '#020617',
              borderRight: { md: '1px solid #172554' },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ p: 2.5, borderBottom: '1px solid #0f172a' }}>
              <Typography variant="h5" fontWeight={800} sx={{ color: '#dbeafe', mb: 0.5 }}>
                Messages
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                Chat with clients and artisans
              </Typography>

              <TextField
                fullWidth
                size="small"
                placeholder="Search chats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={darkInputStyles}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#60a5fa' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <List sx={{ flexGrow: 1, overflowY: 'auto', p: 1.2 }}>
              {loadingChats ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <CircularProgress size={28} sx={{ color: '#3b82f6' }} />
                </Box>
              ) : filteredChats.length > 0 ? (
                filteredChats.map((chat) => {
                  const isActive = Number(activeChatId) === Number(chat.id);

                  return (
                    <ListItemButton
                      key={chat.id}
                      onClick={() => setActiveChatId(chat.id)}
                      sx={{
                        mb: 1,
                        borderRadius: 3,
                        background: isActive
                          ? 'linear-gradient(135deg, rgba(37,99,235,0.22) 0%, rgba(30,58,138,0.35) 100%)'
                          : 'transparent',
                        border: isActive
                          ? '1px solid rgba(59,130,246,0.35)'
                          : '1px solid transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(30, 41, 59, 0.85)',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: '#2563eb',
                            color: '#fff',
                            fontWeight: 700,
                          }}
                        >
                          {chat.participant_avatar || 'U'}
                        </Avatar>
                      </ListItemAvatar>

                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <ListItemText
                          primary={chat.participant_name || 'Unknown User'}
                          secondary={chat.last_message?.text || 'No messages yet'}
                          primaryTypographyProps={{
                            fontWeight: 700,
                            color: '#e2e8f0',
                            noWrap: true,
                          }}
                          secondaryTypographyProps={{
                            color: '#94a3b8',
                            noWrap: true,
                          }}
                        />
                        <Typography variant="caption" sx={{ color: '#60a5fa', fontWeight: 600 }}>
                          {chat.order_id
                            ? `Order #${chat.order_id}`
                            : chat.maintenance_id
                            ? `Maintenance #${chat.maintenance_id}`
                            : 'General chat'}
                        </Typography>
                      </Box>
                    </ListItemButton>
                  );
                })
              ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography sx={{ color: '#94a3b8' }}>No chats found</Typography>
                </Box>
              )}
            </List>
          </Grid>

          <Grid
            item
            xs={12}
            md={8}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#030712',
            }}
          >
            <Box
              sx={{
                p: 2.2,
                borderBottom: '1px solid #172554',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(90deg, rgba(2,6,23,1) 0%, rgba(15,23,42,1) 100%)',
              }}
            >
              {activeChat ? (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: '#2563eb', width: 48, height: 48 }}>
                    {activeChat.participant_avatar || 'U'}
                  </Avatar>

                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#e2e8f0' }}>
                      {activeChat.participant_name}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.7 }}>
                      <Chip
                        label={
                          activeChat.order_id
                            ? `Order #${activeChat.order_id}`
                            : activeChat.maintenance_id
                            ? `Maintenance #${activeChat.maintenance_id}`
                            : 'General chat'
                        }
                        size="small"
                        sx={{
                          bgcolor: 'rgba(37,99,235,0.15)',
                          color: '#93c5fd',
                          border: '1px solid rgba(59,130,246,0.25)',
                        }}
                      />
                    </Stack>
                  </Box>
                </Stack>
              ) : (
                <Typography sx={{ color: '#94a3b8' }}>Select a chat</Typography>
              )}
            </Box>

            <Box
              sx={{
                flexGrow: 1,
                p: 3,
                overflowY: 'auto',
                background:
                  'radial-gradient(circle at top right, rgba(37,99,235,0.08), transparent 25%), #030712',
              }}
            >
              {loadingMessages ? (
                <Box sx={{ textAlign: 'center', mt: 5 }}>
                  <CircularProgress size={28} sx={{ color: '#3b82f6' }} />
                </Box>
              ) : (
                <Stack spacing={2}>
                  {messages.map((msg) => {
                    const isMine = Number(msg.sender_id) === Number(currentUserId);

                    return (
                      <Box
                        key={msg.id}
                        sx={{
                          alignSelf: isMine ? 'flex-end' : 'flex-start',
                          maxWidth: '75%',
                        }}
                      >
                        <Box
                          sx={{
                            p: 1.6,
                            borderRadius: isMine
                              ? '18px 18px 4px 18px'
                              : '18px 18px 18px 4px',
                            bgcolor: isMine ? '#2563eb' : '#111827',
                            border: isMine
                              ? '1px solid rgba(96,165,250,0.35)'
                              : '1px solid #1e293b',
                            color: '#e5e7eb',
                          }}
                        >
                          <Typography variant="body2">{msg.text}</Typography>
                        </Box>
                      </Box>
                    );
                  })}

                  {!loadingMessages && activeChat && messages.length === 0 && (
                    <Box sx={{ textAlign: 'center', mt: 5 }}>
                      <Typography sx={{ color: '#94a3b8' }}>
                        No messages yet. Start the conversation.
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}
            </Box>

            <Box
              sx={{
                p: 2,
                borderTop: '1px solid #172554',
                bgcolor: '#020617',
              }}
            >
              <Stack direction="row" spacing={1.5}>
                <TextField
                  fullWidth
                  placeholder="Type a message..."
                  variant="outlined"
                  size="small"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  sx={darkInputStyles}
                />

                <IconButton
                  onClick={handleSendMessage}
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2.5,
                    bgcolor: '#2563eb',
                    color: '#fff',
                    '&:hover': {
                      bgcolor: '#1d4ed8',
                    },
                  }}
                >
                  <Send />
                </IconButton>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Chat;