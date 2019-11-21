import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import gql from "graphql-tag";
import { useMutation, useQuery } from "@apollo/react-hooks";
// reactstrap components
import { Row, Col } from "reactstrap";

// Declaring variables
var filename = "";
var imageSource;

const uploadFileMutation = gql`
  mutation UploadFile($file: Upload!) {
    uploadFile(file: $file)
  }
`;

const filesQuery = gql`
  {
    yoloImage
    yoloResponse {
      label
      confidence
      topLeft
      topRight
      bottomLeft
      bottomRight
    }
  }
`;

class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.ctx = null;
    this.canvas = null;
    this.img = null;
  }
  drawRectangle(ctx, label, confidence, ax, ay, bx, by) {
    const title = label.toUpperCase() + " " + confidence.slice(0, 5);
    const w = bx - ax;
    const h = by - ay;

    if (confidence <= 0.5) {
      this.ctx.strokeStyle = "#FF595E";
      this.ctx.fillStyle = "#FF595E";
    } else {
      this.ctx.strokeStyle = "#7FFFD4";
      this.ctx.fillStyle = "#7FFFD4";
    }

    ctx.beginPath();
    ctx.rect(ax, ay, w, h);
    ctx.fillText(title, ax, ay);
    ctx.stroke();
    ctx.closePath();
  }
  componentDidMount() {
    // Render initial drawing here
    this.canvas = this.refs.canvas;
    this.ctx = this.canvas.getContext("2d");
    this.img = this.refs.image;

    this.img.onload = () => {
      this.canvas.height = this.img.height;
      this.canvas.width = this.img.width;
      this.ctx.drawImage(this.img, 0, 0);
    };
  }

  componentDidUpdate() {
    // Render the draw here
    console.log(this.props.json);
    var yoloResponse = this.props.json;
    console.log(yoloResponse);

    // Start with an empty state
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.img, 0, 0);
    this.ctx.lineWidth = "2";
    this.ctx.strokeWidth = 5;
    this.ctx.shadowBlur = 30;

    this.ctx.strokeStyle = "#7FFFD4";
    this.ctx.shadowColor = "#7FFFD4";
    this.ctx.fillStyle = "#F79A65";
    this.ctx.font = "10px Arial";
    this.ctx.textBaseline = "bottom";
    this.ctx.textAlign = "start";

    for (let i = 0; i < yoloResponse.length; i++) {
      this.drawRectangle(
        this.ctx,
        yoloResponse[i].label,
        yoloResponse[i].confidence,
        yoloResponse[i].topLeft,
        yoloResponse[i].topRight,
        yoloResponse[i].bottomLeft,
        yoloResponse[i].bottomRight
      );
    }
  }

  render() {
    return (
      <Col md="12">
        <Row>
          <Col md="6" className="styleCol">
            <h6>Original</h6>
            <img
              ref="image"
              src={this.props.source}
              className="hidden"
              alt={filename}
            />
          </Col>
          <Col md="6" className="styleCol">
            <h6>Output</h6>
            <canvas ref="canvas" />
          </Col>
        </Row>
      </Col>
    );
  }
}

export const Upload = () => {
  const [uploadFile] = useMutation(uploadFileMutation, {
    refetchQueries: [{ query: filesQuery }]
  });

  const [file, setFiles] = useState([]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
      setFiles(
        acceptedFiles.map(file =>
          Object.assign(
            file,
            {
              preview: URL.createObjectURL(file)
            },
            uploadFile({ variables: { file } })
          )
        )
      );
    }
  });

  // Fetching the image source
  file.map(file => (imageSource = file.preview));

  const { data, loading } = useQuery(filesQuery);
  console.log("Starting");
  console.log(data);
  console.log(loading);
  console.log(filename);
  console.log(imageSource);

  // Check if there is an image uploaded
  if (!imageSource) {
    // No image uploaded, return default page
    return (
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="paraTitle">Drop the files here ...</p>
        ) : (
          <p className="paraTitle">
            Drag 'n' drop some files here, or click to select files
          </p>
        )}
      </div>
    );
  } else {
    // Image is uploaded, check for yolo response
    if (data != null) {
      // Yolo response is back, check if the file is a new file
      if (data.yoloImage != filename) {
        // File needs to be drawn on
        console.log("I AM GOING TO DRAW");
        console.log(data.yoloResponse);
        // File is a new file needed to be drawn on
        filename = data.yoloImage;
        return (
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="paraTitle">Drop the files here ...</p>
            ) : (
              <p className="paraTitle">
                Drag 'n' drop some files here, or click to select files
              </p>
            )}
            <hr></hr>
            <Canvas source={imageSource} json={data.yoloResponse} />
          </div>
        );
      } else {
        console.log("no need to draw");
        // File is an existing file that does not need to be drawn on
        return (
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="paraTitle">Drop the files here ...</p>
            ) : (
              <p className="paraTitle">
                Drag 'n' drop some files here, or click to select files
              </p>
            )}
            <hr></hr>
            <Canvas source={imageSource} json={data.yoloResponse} />
          </div>
        );
      }
    } else {
      // Image has been uploaded but yolo data is not back
      return (
        <div {...getRootProps()}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <p className="paraTitle">Drop the files here ...</p>
          ) : (
            <p className="paraTitle">
              Drag 'n' drop some files here, or click to select files
            </p>
          )}
          <hr></hr>
          <Canvas source={imageSource} />
        </div>
      );
    }
  }
};
