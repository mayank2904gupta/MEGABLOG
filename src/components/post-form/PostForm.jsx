import React, { useCallback,useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, RTE, Select } from "..";
import appwriteService from "../../APPWRITE/config";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function PostForm({ post }) {
    const { register, handleSubmit, watch, setValue, control, getValues } = useForm({
        defaultValues: {
            title: post?.title || "",
            slug: post?.$id || "",
            content: post?.content || "",
            status: post?.status || "active",
        },
    });
    const [loader, setLoader] = useState(false);
    const navigate = useNavigate();
    const userData = useSelector((state) => state.auth.userData);

    const submit = async (data) => {
        if (post) {
            const file = data.image[0] ? await appwriteService.uploadFile(data.image[0]) : null;

            if (file) {
                appwriteService.deleteFile(post.featuredImage);
            }

            const dbPost = await appwriteService.updatePost(post.$id, {
                ...data,
                featuredImage: file ? file.$id : undefined,
            });

            if (dbPost) {
                navigate(`/post/${dbPost.$id}`);
            }
        } else {
            const file = await appwriteService.uploadFile(data.image[0]);

            if (file) {
                const fileId = file.$id;
                data.featuredImage = fileId;
                const dbPost = await appwriteService.createPost({ ...data, userId: userData.$id });

                if (dbPost) {
                    navigate(`/post/${dbPost.$id}`);
                }
            }
        }
    };

    const slugTransform = useCallback((value) => {
        if (value && typeof value === "string")
            return value
                .trim()
                .toLowerCase()
                .replace(/[!@#$%^&*()_+=[\]{};':"\\|,.<>/?]+/g, "")
                .replace(/\s+/g, "-");

        return "";
    }, []);

    React.useEffect(() => {
        const subscription = watch((value, { name }) => {
            if (name === "title") {
                setValue("slug", slugTransform(value.title), { shouldValidate: true });
            }
        });

        return () => subscription.unsubscribe();
    }, [watch, slugTransform, setValue]);

    return loader ? (
        <p className="text-center">Loading...</p>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
          <div className="w-2/3 px-2">
            <Input
              label="Title :"
              placeholder="Title"
              className="mb-4"
              {...register("title", { required: true })}
            />
            <Input
              label="Slug :"
              placeholder="Slug"
              className="mb-4"
              {...register("slug", { required: true })}
              onInput={(e) => {
                setValue("slug", slugTransform(e.currentTarget.value), {
                  shouldValidate: true,
                });
              }}
            />
            <RTE
              label="Content :"
              name="content"
              control={control}
              defaultValue={getValues("content")}
            />
          </div>
          <div className="w-1/3 px-2">
            <Input
              label="Featured Image :"
              type="file"
              className="mb-4"
              accept="image/png, image/jpg, image/jpeg, image/gif"
              {...register("image", { required: !post })}
            />
            {post && (
              <div className="w-full mb-4 flex items-center justify-center">
                <img
                  src={storageService.getFilePreview(post.featuredImg, 500)}
                  alt={post.title}
                  className="rounded-lg"
                />
              </div>
            )}
            <Select
              options={["active", "inactive"]}
              label="Status"
              className="mb-4"
              {...register("status", { required: true })}
            />
            <Button
              type="submit"
              bgColor={post ? "bg-green-600" : undefined}
              className={`w-full ${
                post ? "hover:bg-green-500" : "hover:bg-blue-500"
              }`}
            >
              {post ? "Update" : "Submit"}
            </Button>
          </div>
        </form>
      );
    }