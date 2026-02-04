import { useInboxStore } from '@/store/useInboxStore';

async function verify() {
    console.log('Starting Inbox Verification...');

    // 1. Initial State
    const initialState = useInboxStore.getState();
    if (initialState.messages.length !== 0) throw new Error('Initial messages should be empty');
    if (initialState.isLoading) throw new Error('Initial isLoading should be false');
    console.log('✅ Initial state correct');

    // 2. Fetch Messages
    console.log('Fetching messages...');
    const fetchPromise = initialState.fetchMessages();

    // Check loading state immediately
    if (!useInboxStore.getState().isLoading) throw new Error('isLoading should be true during fetch');

    await fetchPromise;

    const loadedState = useInboxStore.getState();
    if (loadedState.isLoading) throw new Error('isLoading should be false after fetch');
    if (loadedState.messages.length !== 10) throw new Error(`Expected 10 messages, got ${loadedState.messages.length}`);
    console.log('✅ Fetch messages correct');

    // 3. Verify Message Content (Sample)
    const firstMsg = loadedState.messages[0];
    if (!firstMsg.subject) throw new Error('Message missing subject');
    if (!firstMsg.type) throw new Error('Message missing type');
    console.log('✅ Message structure correct');

    // 4. Mark as Read
    const msgId = firstMsg.id;
    // Note: Use fresh state from store
    if (useInboxStore.getState().messages.find(m => m.id === msgId)?.isRead !== firstMsg.isRead) {
        // Just ensuring we are consistent. firstMsg is from loadedState snapshot.
    }

    const initialReadStatus = firstMsg.isRead;

    loadedState.markAsRead(msgId);

    const msgAfterRead = useInboxStore.getState().messages.find(m => m.id === msgId);
    if (msgAfterRead?.isRead !== true) throw new Error('Message should be read after markAsRead');
    console.log('✅ Mark as read correct');

    // 5. Toggle Pin
    const isPinnedInitial = msgAfterRead?.isPinned;
    loadedState.togglePin(msgId);
    const msgAfterPin = useInboxStore.getState().messages.find(m => m.id === msgId);
    if (msgAfterPin?.isPinned === isPinnedInitial) throw new Error('Pin status did not toggle');
    console.log('✅ Toggle pin correct');

    console.log('🎉 All verifications passed!');
}

verify().catch(e => {
    console.error('❌ Verification failed:', e);
    throw e;
});
