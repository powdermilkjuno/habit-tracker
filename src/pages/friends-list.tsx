import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useStore from '../stores/useStore';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus, Trash2, Copy } from 'lucide-react';

interface Friend {
    id: string;
    email?: string;
    friendCode?: string;
}

interface User {
    id: string;
    email?: string;
}

type StoreState = {
    user: User | null;
    addFriend: (friendCode: string) => Promise<void>;
    removeFriend: (friendId: string) => Promise<void>;
    friends: Friend[];
    fetchFriends: () => Promise<void>;
    getUserFriendCode: () => Promise<string | null>;
}

export default function FriendsList() {
    const router = useRouter();
    const [friendCode, setFriendCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [myFriendCode, setMyFriendCode] = useState<string | null>(null);
    // Add error state
    const [addFriendError, setAddFriendError] = useState<string | null>(null);
    
    // Get the required functions and state from the store
    const { user, addFriend, removeFriend, friends, fetchFriends, getUserFriendCode } = 
        useStore() as unknown as StoreState;

    useEffect(() => {
        if (!user) {
            router.push('/edit-profile');
            return;
        }
        
        // Fetch friends when component loads
        fetchFriends();
        
        // Get user's own friend code
        const getCode = async () => {
            const code = await getUserFriendCode();
            setMyFriendCode(code);
        };
        
        getCode();
    }, [user, router, fetchFriends, getUserFriendCode]);

    const handleAddFriend = async () => {
        if (!friendCode.trim()) {
            setAddFriendError("Please enter a valid friend code");
            return;
        }

        setAddFriendError(null);
        setIsLoading(true);
        
        try {
            await addFriend(friendCode);
            // Force a refresh of the friends list
            await fetchFriends();
            toast.success("Friend added successfully");
            setFriendCode('');
        } catch (error: unknown) {
            console.error("Error adding friend:", error);
            setAddFriendError(error instanceof Error ? error.message : "Failed to add friend");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleRemoveFriend = async (friendId: string) => {
        try {
            await removeFriend(friendId);
            toast.success("Friend removed");
        } catch (error) {
            console.error("Error removing friend:", error);
            toast.error("Failed to remove friend");
        }
    };
    
    const copyFriendCode = () => {
        if (myFriendCode && typeof navigator !== 'undefined') {
            navigator.clipboard.writeText(myFriendCode)
                .then(() => toast.success("Friend code copied to clipboard!"))
                .catch(err => console.error("Failed to copy to clipboard:", err));
        }
    };

    return (
        <div className="container mx-auto py-8">
            {/* Back button */}
            <div className="mb-4">
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft size={16} />
                    Back to Home
                </Button>
            </div>

            <h1 className="text-3xl font-bold mb-8">Friends List</h1>
            
            {/* My Friend Code Card */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>My Friend Code</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded flex-1 font-mono text-center">
                            {myFriendCode || "Loading..."}
                        </div>
                        <Button variant="outline" onClick={copyFriendCode} disabled={!myFriendCode}>
                            <Copy size={16} className="mr-2" /> Copy
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Share this code with friends so they can add you!
                    </p>
                </CardContent>
            </Card>
            
            {/* Add Friend Card */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Add Friend</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Input
                            placeholder="Enter friend code (e.g. F123456)"
                            value={friendCode}
                            onChange={(e) => {
                                setFriendCode(e.target.value);
                                // Clear error when typing
                                if (addFriendError) setAddFriendError(null);
                            }}
                            className={`flex-1 ${addFriendError ? 'border-red-500' : ''}`}
                        />
                        <Button 
                            onClick={handleAddFriend} 
                            disabled={isLoading}
                            className="flex items-center gap-2"
                        >
                            <UserPlus size={16} />
                            {isLoading ? "Adding..." : "Add Friend"}
                        </Button>
                    </div>
                    
                    {/* Display error message inline */}
                    {addFriendError && (
                        <p className="mt-2 text-sm text-red-500">{addFriendError}</p>
                    )}
                </CardContent>
            </Card>

            {/* Friends List Card */}
            <Card>
                <CardHeader>
                    <CardTitle>My Friends</CardTitle>
                </CardHeader>
                <CardContent>
                    {friends && friends.length > 0 ? (
                        <div className="space-y-4">
                            {friends.map((friend: Friend) => (
                                <div key={friend.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                                                {friend.email?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{friend.email || 'Unknown User'}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Friend Code: {friend.friendCode || 'Unknown'}
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleRemoveFriend(friend.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">You haven&apos;t added any friends yet.</p>
                            <p className="text-sm mt-2">Add friends using their friend code to see them here.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}