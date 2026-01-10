/**
 * GraphQL resolvers for the demo app
 */
interface User {
    id: string;
    name: string;
    email: string;
}
interface Post {
    id: string;
    title: string;
    body: string;
    user_id: string;
    created_at?: string;
}
interface Comment {
    id: string;
    body: string;
    user_id: string;
    post_id: string;
}
export declare const resolvers: {
    Query: {
        users: () => User[];
        posts: () => Post[];
        comments: () => Comment[];
        user: (_parent: unknown, { id }: {
            id: string;
        }) => User | null;
        post: (_parent: unknown, { id }: {
            id: string;
        }) => Post | null;
        comment: (_parent: unknown, { id }: {
            id: string;
        }) => Comment | null;
        postsByUser: (_parent: unknown, { user_id }: {
            user_id: string;
        }) => Post[];
    };
    User: {
        posts: (parent: User) => Post[];
    };
    Mutation: {
        createUser: (_parent: unknown, { name, email }: {
            name: string;
            email: string;
        }) => User;
        createPost: (_parent: unknown, { title, user_id, body }: {
            title: string;
            user_id: string;
            body: string;
        }) => Post;
        createComment: (_parent: unknown, { post_id, user_id, body }: {
            post_id: string;
            user_id: string;
            body: string;
        }) => Comment;
        updateUser: (_parent: unknown, { id, name, email }: {
            id: string;
            name: string;
            email: string;
        }) => User | null;
        updatePost: (_parent: unknown, { id, title, user_id, body }: {
            id: string;
            title: string;
            user_id: string;
            body: string;
        }) => Post | null;
        updateComment: (_parent: unknown, { id, post_id, user_id, body }: {
            id: string;
            post_id: string;
            user_id: string;
            body: string;
        }) => Comment | null;
        deleteUser: (_parent: unknown, { id }: {
            id: string;
        }) => User | null;
        deletePost: (_parent: unknown, { id }: {
            id: string;
        }) => Post | null;
        deleteComment: (_parent: unknown, { id }: {
            id: string;
        }) => Comment | null;
        reset: () => {
            users: User[];
            posts: Post[];
            comments: Comment[];
        } | null;
    };
};
export {};
//# sourceMappingURL=resolvers.d.ts.map